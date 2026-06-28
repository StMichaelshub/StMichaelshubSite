import Promotion from "@/models/Promotion";
import { mongooseConnect } from "@/lib/mongoose";

function isDateActive(promotion, now) {
  const startsAt = promotion.startDate ? new Date(promotion.startDate) : null;
  const endsAt = promotion.endDate ? new Date(promotion.endDate) : null;
  if (endsAt && endsAt.getUTCHours() === 0 && endsAt.getUTCMinutes() === 0 && endsAt.getUTCSeconds() === 0 && endsAt.getUTCMilliseconds() === 0) {
    endsAt.setUTCHours(23, 59, 59, 999);
  }
  if (startsAt && startsAt > now) return false;
  if (!promotion.indefinite && endsAt && endsAt < now) return false;
  return true;
}

function serializePromotion(promotion) {
  return {
    _id: String(promotion._id),
    name: promotion.name || "",
    description: promotion.description || "",
    valueType: promotion.valueType || "DISCOUNT",
    discountType: promotion.discountType || "PERCENTAGE",
    discountValue: promotion.discountValue || 0,
    applicationType: promotion.applicationType || "ALL_PRODUCTS",
    products: Array.isArray(promotion.products) ? promotion.products.map(String) : [],
    categories: Array.isArray(promotion.categories) ? promotion.categories.map(String) : [],
    startDate: promotion.startDate?.toISOString?.() || null,
    endDate: promotion.endDate?.toISOString?.() || null,
    indefinite: Boolean(promotion.indefinite),
    active: promotion.active !== false,
  };
}

export async function getActivePublicPromotions() {
  const connection = await mongooseConnect({ allowFailure: true });
  if (!connection) {
    return [];
  }

  const now = new Date();
  const promotions = await Promotion.find({ active: true })
    .sort({ priority: -1, createdAt: -1 })
    .lean();

  return promotions
    .filter((promotion) => isDateActive(promotion, now))
    .map(serializePromotion);
}
