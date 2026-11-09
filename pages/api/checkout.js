import { mongooseConnect } from "@/lib/mongoose";
import { buildOrderDraft } from "@/lib/checkout";
import {
  createReservedOrder,
  releaseExpiredReservations,
  RESERVATION_WINDOW_MINUTES,
} from "@/lib/orderLifecycle";
import { createOrderAccessToken } from "@/lib/orderAccess";
import {
  assertCanOpenAnotherOrder,
  buildOrderCustomer,
  resolveCheckoutCustomer,
} from "@/lib/checkoutCustomer";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  await mongooseConnect();

  try {
    await releaseExpiredReservations();

    const orderDraft = await buildOrderDraft({
      customer: req.body.customer,
      cartProducts: req.body.items || req.body.cartProducts,
      siteKey: req.body.siteKey,
    });

    if (orderDraft.errors?.length) {
      return res.status(400).json({
        message: orderDraft.errors[0],
        errors: orderDraft.errors,
      });
    }

    await assertCanOpenAnotherOrder(orderDraft.customer.email);

    const storedCustomer = await resolveCheckoutCustomer(req, orderDraft.customer);

    const order = await createReservedOrder({
      customer: buildOrderCustomer(storedCustomer, orderDraft.customer),
      customerId: storedCustomer._id,
      orderDraft,
    });

    return res.status(200).json({
      message: "Order placed",
      orderId: order._id,
      accessToken: createOrderAccessToken(order._id),
      totals: {
        subtotal: orderDraft.subtotal,
        shippingCost: orderDraft.shippingCost,
        total: orderDraft.total,
      },
      reservation: {
        expiresAt: order.reservationExpiresAt,
        windowMinutes: RESERVATION_WINDOW_MINUTES,
      },
    });
  } catch (err) {
    console.error("Checkout Error:", err);
    return res.status(err.statusCode || 500).json({ message: err.message || "Server error" });
  }
}
