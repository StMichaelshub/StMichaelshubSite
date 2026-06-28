import { mongooseConnect } from "@/lib/mongoose";
import Customer from "@/models/Customer";
import { buildOrderDraft } from "@/lib/checkout";
import {
  createReservedOrder,
  releaseExpiredReservations,
  RESERVATION_WINDOW_MINUTES,
} from "@/lib/orderLifecycle";

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

    const existing = await Customer.findOneAndUpdate(
      { email: orderDraft.customer.email },
      { $set: { ...orderDraft.customer, type: "ONLINE" } },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    const order = await createReservedOrder({
      customer: existing,
      customerId: existing._id,
      orderDraft,
    });

    return res.status(200).json({
      message: "Order placed",
      orderId: order._id,
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
