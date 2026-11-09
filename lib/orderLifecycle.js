import Order from "@/models/Order";
import { PUBLIC_PRODUCT_SELECT, PUBLIC_CUSTOMER_SELECT } from "@/lib/orderAccess";
import { Product } from "@/models/Product";
import Transaction from "@/models/Transaction";
import {
  finalizeInventoryForSale,
  getAvailableInventoryQuantity,
  normalizeTransactionItems,
} from "@/lib/inventory";
import {
  sendBusinessOrderPlacedEmail,
  sendOrderPlacedEmail,
  sendOrderProcessingEmail,
} from "@/lib/orderStatusEmail";
import { createMailTransport, getMailFromAddress } from "@/lib/mail";

export const RESERVATION_WINDOW_MINUTES = 1440;
const ONLINE_TENDER_NAME = "ONLINE";
const ONLINE_SALES_CHANNEL = "ONLINE_STORE";
const ONLINE_SOURCE_ORDER_TYPE = "online-order";

class OrderLifecycleError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = "OrderLifecycleError";
    this.statusCode = statusCode;
  }
}

function resolveProductId(item) {
  return item?.productId?._id || item?.productId;
}

function getOrderItems(order) {
  if (Array.isArray(order?.items) && order.items.length > 0) {
    return order.items;
  }

  return Array.isArray(order?.cartProducts) ? order.cartProducts : [];
}

function getOrderCustomerName(order) {
  return (
    order?.shippingDetails?.name ||
    order?.customerSnapshot?.name ||
    order?.customer?.name ||
    "Online Customer"
  );
}

function getOrderCustomerId(order) {
  const customerId = order?.customer?._id || order?.customer;
  return customerId || null;
}

async function ensureOnlineOrderTransaction(order, { inventoryUpdated = true } = {}) {
  if (!order?._id) {
    return { transaction: null, created: false };
  }

  const externalId = `order:${String(order._id)}`;
  const sourceOrderId = String(order._id);
  const items = normalizeTransactionItems(getOrderItems(order));
  const tenderPayment = {
    tenderType: ONLINE_TENDER_NAME,
    tenderName: ONLINE_TENDER_NAME,
    amount: Number(order.total || 0),
  };

  const existingTransaction = await Transaction.findOne({
    $or: [{ externalId }, { sourceOrderId }],
  });

  if (existingTransaction) {
    existingTransaction.externalId = existingTransaction.externalId || externalId;
    existingTransaction.dedupeKey = existingTransaction.dedupeKey || externalId;
    existingTransaction.salesChannel = ONLINE_SALES_CHANNEL;
    existingTransaction.sourceOrderId = sourceOrderId;
    existingTransaction.sourceOrderType = ONLINE_SOURCE_ORDER_TYPE;
    existingTransaction.sourceSiteKey = order.siteKey || "store";
    existingTransaction.inventoryUpdated = Boolean(existingTransaction.inventoryUpdated || inventoryUpdated);
    existingTransaction.updatedAt = new Date();

    if (!existingTransaction.tenderType) {
      existingTransaction.tenderType = ONLINE_TENDER_NAME;
    }

    if (!Array.isArray(existingTransaction.tenderPayments) || existingTransaction.tenderPayments.length === 0) {
      existingTransaction.tenderPayments = [tenderPayment];
    }

    if (existingTransaction.isModified()) {
      await existingTransaction.save();
    }

    return { transaction: existingTransaction, created: false };
  }

  if (!items.length) {
    return { transaction: null, created: false };
  }

  try {
    const transaction = await Transaction.create({
      tenderType: ONLINE_TENDER_NAME,
      tenderPayments: [tenderPayment],
      amountPaid: Number(order.total || 0),
      subtotal: Number(order.subtotal || order.total || 0),
      tax: 0,
      total: Number(order.total || 0),
      shippingCost: Number(order.shippingCost || 0),
      deliveryFee: Number(order.shippingCost || 0),
      deliveryFeeName: "Delivery Fee",
      staffName: "Online Store",
      location: order.locationName || "online",
      locationId: order.locationId || null,
      device: "Web",
      discount: 0,
      customerId: getOrderCustomerId(order),
      customerName: getOrderCustomerName(order),
      transactionType: "pos",
      status: "completed",
      change: 0,
      items,
      externalId,
      dedupeKey: externalId,
      inventoryUpdated: Boolean(inventoryUpdated),
      salesChannel: ONLINE_SALES_CHANNEL,
      sourceOrderId,
      sourceOrderType: ONLINE_SOURCE_ORDER_TYPE,
      sourceSiteKey: order.siteKey || "store",
      createdAt: order.finalizedAt || new Date(),
      updatedAt: new Date(),
    });

    return { transaction, created: true };
  } catch (error) {
    if (error?.code === 11000) {
      const transaction = await Transaction.findOne({
        $or: [{ externalId }, { sourceOrderId }],
      });
      return { transaction, created: false };
    }

    throw error;
  }
}

async function reserveInventoryForOrderItems(orderItems) {
  const reservedItems = [];

  try {
    for (const item of orderItems) {
      const quantity = Number(item.quantity || 0);
      const productId = resolveProductId(item);

      const reservedProduct = await Product.findOneAndUpdate(
        {
          _id: productId,
          $expr: {
            $gte: [
              {
                $subtract: ["$quantity", { $ifNull: ["$reservedQuantity", 0] }],
              },
              quantity,
            ],
          },
        },
        { $inc: { reservedQuantity: quantity } },
        { new: true }
      );

      if (!reservedProduct) {
        throw new OrderLifecycleError(
          `Inventory changed before checkout could complete for ${item.name}. Please review your cart and try again.`,
          409
        );
      }

      reservedItems.push({ productId, quantity });
    }
  } catch (error) {
    for (const reservedItem of reservedItems) {
      await Product.findByIdAndUpdate(reservedItem.productId, {
        $inc: { reservedQuantity: -(reservedItem.quantity || 0) },
      });
    }

    throw error;
  }
}

async function releaseReservedInventory(order) {
  for (const item of order.items || []) {
    const productId = resolveProductId(item);
    if (!productId) {
      continue;
    }

    await Product.findByIdAndUpdate(productId, {
      $inc: { reservedQuantity: -(item.quantity || 0) },
    });
  }
}

export async function createReservedOrder({ customer, customerId, orderDraft }) {
  const reservationExpiresAt = new Date(
    Date.now() + RESERVATION_WINDOW_MINUTES * 60 * 1000
  );

  const shippingDetails = {
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    city: customer.city,
  };

  await reserveInventoryForOrderItems(orderDraft.orderItems);

  try {
    const createdOrder = await Order.create({
      customer: customerId,
      siteKey: orderDraft.siteKey,
      locationId: orderDraft.locationId || null,
      locationName: orderDraft.locationName || "",
      customerSnapshot: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        type: customer.type || "ONLINE",
      },
      shippingDetails,
      items: orderDraft.orderItems,
      cartProducts: orderDraft.orderItems,
      subtotal: orderDraft.subtotal,
      shippingCost: orderDraft.shippingCost,
      total: orderDraft.total,
      status: "Inventory Reserved",
      paid: false,
      paymentStatus: "Pending",
      paymentChannel: "manual-entry",
      reservationStatus: "active",
      reservationExpiresAt,
    });

    await Promise.allSettled([
      sendOrderPlacedEmail(createdOrder),
      sendBusinessOrderPlacedEmail(createdOrder),
    ]);

    return createdOrder;
  } catch (error) {
    for (const item of orderDraft.orderItems) {
      const productId = resolveProductId(item);
      if (!productId) {
        continue;
      }

      await Product.findByIdAndUpdate(productId, {
        $inc: { reservedQuantity: -(item.quantity || 0) },
      });
    }

    throw error;
  }
}

export async function releaseOrderReservation(
  orderId,
  {
    status = "Reservation Expired",
    paymentStatus = "Expired",
    cancellationReason = "Reservation expired before payment completion.",
  } = {}
) {
  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      paid: false,
      reservationStatus: "active",
    },
    {
      $set: {
        reservationStatus: "releasing",
      },
    },
    { new: true }
  );

  if (!order) {
    return Order.findById(orderId).populate({ path: "customer", select: PUBLIC_CUSTOMER_SELECT }).populate({ path: "items.productId", select: PUBLIC_PRODUCT_SELECT });
  }

  await releaseReservedInventory(order);

  return Order.findByIdAndUpdate(
    orderId,
    {
      $set: {
        reservationStatus: "released",
        reservationReleasedAt: new Date(),
        status,
        paymentStatus,
        cancellationReason,
      },
    },
    { new: true }
  )
    .populate({ path: "customer", select: PUBLIC_CUSTOMER_SELECT })
    .populate({ path: "items.productId", select: PUBLIC_PRODUCT_SELECT });
}

export async function releaseExpiredReservations() {
  const expiredOrders = await Order.find({
    paid: false,
    reservationStatus: "active",
    reservationExpiresAt: { $lte: new Date() },
  }).select("_id");

  for (const order of expiredOrders) {
    await releaseOrderReservation(order._id);
  }

  return expiredOrders.length;
}

/**
 * Paystack took the customer's money but the order could not accept it
 * automatically (reservation expired, order missing, amount mismatch). Record it
 * on the order and email the business so a person follows up - the payment must
 * never just disappear.
 */
export async function flagPaymentForReview({ orderId, reference, amountInKobo, reason }) {
  const amount = Number(amountInKobo || 0) / 100;
  let order = null;

  try {
    order = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: {
          paymentReviewRequired: true,
          paymentReviewReason: reason,
          paymentReviewReference: String(reference || ""),
          paymentReviewAmount: amount,
          paymentReviewAt: new Date(),
        },
      },
      { new: true }
    );
  } catch (error) {
    console.error("Could not flag order for payment review:", orderId, error.message);
  }

  console.error(`[PAYMENT REVIEW] order=${orderId} reference=${reference} amount=${amount} reason=${reason}`);

  try {
    const transporter = createMailTransport();
    const to = process.env.BUSINESS_EMAIL || process.env.STORE_EMAIL || process.env.EMAIL_USER;
    if (transporter && to) {
      await transporter.sendMail({
        from: getMailFromAddress(),
        to,
        subject: `Payment needs review - order ${String(orderId).slice(-8)}`,
        text: [
          "A Paystack payment was received but could not be applied to its order automatically.",
          "",
          `Order: ${orderId}${order ? "" : " (not found)"}`,
          `Customer: ${order?.customerSnapshot?.name || order?.shippingDetails?.name || "-"} ${order?.customerSnapshot?.email || ""}`,
          `Paystack reference: ${reference}`,
          `Amount paid: NGN ${amount.toLocaleString("en-NG")}`,
          `Reason: ${reason}`,
          "",
          "Check the payment in Paystack and either fulfil the order or refund the customer.",
        ].join("\n"),
      });
    }
  } catch (error) {
    console.error("Could not email payment review alert:", error.message);
  }
}

export async function finalizeOrderPayment({
  orderId,
  reference,
  amountInKobo,
  paymentStatus = "success",
  paymentChannel = "paystack",
}) {
  const existingOrder = await Order.findById(orderId)
    .populate({ path: "customer", select: PUBLIC_CUSTOMER_SELECT })
    .populate({ path: "items.productId", select: PUBLIC_PRODUCT_SELECT });

  if (!existingOrder) {
    await flagPaymentForReview({ orderId, reference, amountInKobo, reason: "Order not found" });
    throw new OrderLifecycleError("Order not found", 404);
  }

  const expectedAmount = Math.round((existingOrder.total || 0) * 100);
  if (amountInKobo != null && expectedAmount !== Number(amountInKobo)) {
    await flagPaymentForReview({
      orderId,
      reference,
      amountInKobo,
      reason: `Amount paid does not match the order total (expected NGN ${(expectedAmount / 100).toLocaleString("en-NG")})`,
    });
    throw new OrderLifecycleError("Payment amount mismatch", 400);
  }

  if (existingOrder.paid) {
    await ensureOnlineOrderTransaction(existingOrder, {
      inventoryUpdated: Boolean(existingOrder.inventoryFinalizedBy),
    });
    return { order: existingOrder, alreadyProcessed: true };
  }

  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      paid: false,
      reservationStatus: "active",
    },
    {
      $set: {
        paid: true,
        paymentReference: reference,
        paymentStatus: "Paid",
        paymentChannel,
        status: "Processing",
        reservationStatus: "finalizing",
        finalizedAt: new Date(),
      },
    },
    { new: true }
  )
    .populate({ path: "customer", select: PUBLIC_CUSTOMER_SELECT })
    .populate({ path: "items.productId", select: PUBLIC_PRODUCT_SELECT });

  if (!order) {
    const refreshedOrder = await Order.findById(orderId)
      .populate({ path: "customer", select: PUBLIC_CUSTOMER_SELECT })
      .populate({ path: "items.productId", select: PUBLIC_PRODUCT_SELECT });

    if (refreshedOrder?.paid) {
      return { order: refreshedOrder, alreadyProcessed: true };
    }

    await flagPaymentForReview({
      orderId,
      reference,
      amountInKobo,
      reason: `Paid after the stock reservation was no longer active (status: ${refreshedOrder?.reservationStatus || "unknown"})`,
    });

    throw new OrderLifecycleError(
      "This order reservation is no longer active. Please contact support for payment review.",
      409
    );
  }

  await finalizeInventoryForSale(order.items, { orderId: order._id });

  const finalizedOrder = await Order.findByIdAndUpdate(
    orderId,
    {
      $set: {
        paymentReference: reference,
        paymentStatus: paymentStatus === "success" ? "Paid" : paymentStatus,
        paymentChannel,
        status: "Processing",
        reservationStatus: "finalized",
        reservationReleasedAt: new Date(),
        finalizedAt: new Date(),
        inventoryFinalizedBy: "paystack",
      },
    },
    { new: true }
  )
    .populate({ path: "customer", select: PUBLIC_CUSTOMER_SELECT })
    .populate({ path: "items.productId", select: PUBLIC_PRODUCT_SELECT });

  await ensureOnlineOrderTransaction(finalizedOrder, { inventoryUpdated: true });

  await sendOrderProcessingEmail(finalizedOrder);

  return {
    order: finalizedOrder,
    alreadyProcessed: false,
  };
}