function normalizeId(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value._id) return String(value._id);
  if (value.id) return String(value.id);
  return String(value);
}

function normalizeList(values) {
  return Array.isArray(values) ? values.map(normalizeId).filter(Boolean) : [];
}

function normalizePromotionType(value) {
  return String(value || "ALL_PRODUCTS").trim().toUpperCase();
}

export function getPromotionProducts(promotion) {
  return normalizeList(promotion?.products);
}

export function getPromotionCategories(promotion) {
  return normalizeList(promotion?.categories);
}

export function promotionAppliesToProduct(promotion, product) {
  if (!promotion || !product) return false;

  const applicationType = normalizePromotionType(promotion.applicationType);
  if (applicationType === "ALL_PRODUCTS") return true;

  if (applicationType === "ONE_PRODUCT") {
    const productIds = new Set(getPromotionProducts(promotion));
    return productIds.has(normalizeId(product._id));
  }

  if (applicationType === "CATEGORY") {
    const categoryIds = new Set(getPromotionCategories(promotion));
    const productCategoryValues = [
      product.category,
      product.categoryName,
      product.category?._id,
      product.category?.id,
      product.category?.name,
    ]
      .map(normalizeId)
      .filter(Boolean);

    return productCategoryValues.some((value) => categoryIds.has(value));
  }

  return false;
}
