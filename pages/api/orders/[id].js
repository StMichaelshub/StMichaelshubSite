import { isMongoConnectionError, mongooseConnect } from "@/lib/mongoose";
import { loadOrderForShopper } from "@/lib/orderReads";

// GET /api/orders/[id]?access=<token> - the order's confirmation link token, or a
// signed-in customer who owns the order.
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    await mongooseConnect();
    const { status, body } = await loadOrderForShopper(req, {
      id: req.query.id,
      token: req.query.access,
    });
    return res.status(status).json(body);
  } catch (error) {
    console.error("Error fetching order:", error);

    if (isMongoConnectionError(error)) {
      return res.status(503).json({
        message: "Order confirmation is temporarily unavailable. Please try again shortly.",
      });
    }

    return res.status(500).json({ message: "We could not load this order right now." });
  }
}
