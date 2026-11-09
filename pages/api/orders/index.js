import { isMongoConnectionError, mongooseConnect } from "@/lib/mongoose";
import { buildOrderDraft } from "@/lib/checkout";
import {
  createReservedOrder,
  releaseExpiredReservations,
  RESERVATION_WINDOW_MINUTES,
} from "@/lib/orderLifecycle";
import { createOrderAccessToken } from "@/lib/orderAccess";
import { loadOrderForShopper } from "@/lib/orderReads";
import {
  assertCanOpenAnotherOrder,
  buildOrderCustomer,
  resolveCheckoutCustomer,
} from "@/lib/checkoutCustomer";

export default async function handler(req, res) {
  try {
    await mongooseConnect();

    if (req.method === "GET") {
      // GET /api/orders?id=...&access=... (used by the confirmation page)
      const { status, body } = await loadOrderForShopper(req, {
        id: req.query.id,
        token: req.query.access,
      });
      return res.status(status).json(body);
    }

    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method Not Allowed" });
    }

    await releaseExpiredReservations();

    const { customer, cartProducts, siteKey } = req.body || {};
    const orderDraft = await buildOrderDraft({ customer, cartProducts, siteKey });

    if (orderDraft.errors?.length) {
      return res.status(400).json({
        message: orderDraft.errors[0],
        errors: orderDraft.errors,
      });
    }

    await assertCanOpenAnotherOrder(orderDraft.customer.email);

    const storedCustomer = await resolveCheckoutCustomer(req, orderDraft.customer);

    const newOrder = await createReservedOrder({
      customer: buildOrderCustomer(storedCustomer, orderDraft.customer),
      customerId: storedCustomer._id,
      orderDraft,
    });

    return res.status(201).json({
      success: true,
      orderId: newOrder._id,
      accessToken: createOrderAccessToken(newOrder._id),
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
      message: error.statusCode ? error.message : "Error creating order",
      error: error.message,
    });
  }
}
