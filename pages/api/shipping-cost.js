import { buildOrderQuote } from "@/lib/checkout";
import { SUPPORTED_SHIPPING_DESTINATIONS } from "@/lib/shipping";
import { mongooseConnect } from "@/lib/mongoose";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { destination, cartProducts, siteKey } = req.body || {};
  if (!Array.isArray(cartProducts) || cartProducts.length === 0) {
    return res.status(400).json({ error: "cartProducts are required" });
  }

  await mongooseConnect();

  const quote = await buildOrderQuote({
    cartProducts,
    siteKey,
    destination,
  });

  if (quote.errors?.length) {
    return res.status(400).json({
      error: quote.errors[0],
      errors: quote.errors,
    });
  }

  return res.status(200).json({
    success: true,
    availableDestinations: SUPPORTED_SHIPPING_DESTINATIONS,
    totals: {
      baseSubtotal: quote.baseSubtotal,
      subtotal: quote.subtotal,
      discountTotal: quote.discountTotal,
      shippingCost: quote.shippingCost,
      total: quote.total,
    },
    shippingQuote: quote.shippingQuote,
    promotionSummary: quote.promotionSummary,
  });
}
