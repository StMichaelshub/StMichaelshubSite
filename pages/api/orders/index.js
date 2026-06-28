import Customer from "@/models/Customer";
import { isMongoConnectionError, mongooseConnect } from "@/lib/mongoose";
import { buildOrderDraft } from "@/lib/checkout";
import {
  createReservedOrder,
  releaseExpiredReservations,
  RESERVATION_WINDOW_MINUTES,
} from "@/lib/orderLifecycle";
import Order from "@/models/Order";

export default async function handler(req, res) {
  try {
    await mongooseConnect();

    if (req.method === "GET") {
      const { id } = req.query;

      if (!id || Array.isArray(id)) {
        return res.status(400).json({ message: "Order id is required." });
      }

      await releaseExpiredReservations();

      const order = await Order.findById(id)
        .populate("customer")
        .populate("items.productId");

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      return res.status(200).json(order);
    }

    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method Not Allowed" });
    }

    await releaseExpiredReservations();

    const { customer, cartProducts, siteKey } = req.body;
    const orderDraft = await buildOrderDraft({ customer, cartProducts, siteKey });

    if (orderDraft.errors?.length) {
      return res.status(400).json({
        message: orderDraft.errors[0],
        errors: orderDraft.errors,
      });
    }

    const existingCustomer = await Customer.findOneAndUpdate(
      { email: orderDraft.customer.email },
      { $set: { ...orderDraft.customer, type: "ONLINE" } },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    const newOrder = await createReservedOrder({
      customer: existingCustomer,
      customerId: existingCustomer._id,
      orderDraft,
    });

    return res.status(201).json({
      success: true,
      orderId: newOrder._id,
      totals: {
        subtotal: orderDraft.subtotal,
        shippingCost: orderDraft.shippingCost,
        total: orderDraft.total,
      },
      reservation: {
        expiresAt: newOrder.reservationExpiresAt,
        windowMinutes: RESERVATION_WINDOW_MINUTES,
      },
      shippingQuote: orderDraft.shippingQuote,
      message: "Order successfully created",
    });
  } catch (error) {
    if (req.method === "GET") {
      if (isMongoConnectionError(error)) {
        return res.status(503).json({
          message: "Order confirmation is temporarily unavailable. Please try again shortly.",
        });
      }

      console.error("Error fetching order:", error);
      return res.status(500).json({
        message: "We could not load this order right now.",
      });
    }

    console.error("Error creating order:", error);
    return res.status(error.statusCode || 500).json({
      message: "Error creating order",
      error: error.message,
    });
  }
}
