import mongoose from "mongoose";
import Category from "@/models/Category";
import Promotion from "@/models/Promotion";
import { Product } from "@/models/Product";
import { normalizeProductImages } from "@/lib/productImages";
import { resolveSiteOrderLocation } from "@/lib/orderLocation";
import { getAvailableInventoryQuantity } from "@/lib/inventory";
import { normalizePublicSite, productMatchesPublicSite } from "@/lib/publicSite";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ONLINE_CUSTOMER_TYPE = "ONLINE";

function cleanText(value) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function normalizeQuantity(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 1;
  }

  return Math.max(1, Math.floor(parsed));
}

function resolveCartProductId(item) {
  if (!item || typeof item !== "object") {
    return "";
  }

  const candidate = item._id || item.productId || item.id;
  return typeof candidate === "string" ? candidate.trim() : "";
}

export function normalizeCustomer(customer = {}) {
  return {
    name: cleanText(customer.name),
    email: cleanText(customer.email).toLowerCase(),
    phone: cleanText(customer.phone),
    address: cleanText(customer.address),
    city: cleanText(customer.city),
  };
}

export function validateCustomer(customer) {
  const errors = [];

  if (!customer.name) errors.push("Full name is required.");
  if (!customer.email) errors.push("Email address is required.");
  if (customer.email && !EMAIL_REGEX.test(customer.email)) {
    errors.push("Enter a valid email address.");
  }

  const phoneDigits = customer.phone.replace(/\D/g, "");
  if (!customer.phone) errors.push("Phone number is required.");
  if (customer.phone && phoneDigits.length < 10) {
    errors.push("Enter a valid phone number with at least 10 digits.");
  }

  if (!customer.address) errors.push("Street address is required.");
  if (!customer.city) errors.push("Delivery city is required.");

  return errors;
}

function normalizeAmount(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeObjectIdString(value) {
  const candidate = String(value || "").trim();
  return mongoose.Types.ObjectId.isValid(candidate) ? candidate : "";
}

function normalizeCategoryValue(value) {
  return String(value || "").trim().toLowerCase();
}

function sortPromotions(promotions = []) {
  return [...promotions].sort((left, right) => {
    const leftPriority = Number.isFinite(Number(left?.priority))
      ? Number(left.priority)
      : Number.MAX_SAFE_INTEGER;
    const rightPriority = Number.isFinite(Number(right?.priority))
      ? Number(right.priority)
      : Number.MAX_SAFE_INTEGER;

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    return String(left?.name || "").localeCompare(String(right?.name || ""));
  });
}

function getPromotionKey(promotion) {
  return String(promotion?._id || promotion?.name || "").trim();
}

function dedupePromotions(promotions = []) {
  const seen = new Set();

  return promotions.filter((promotion) => {
    const key = getPromotionKey(promotion);
    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function isFixedTotalPromotion(promotion) {
  return (
    String(promotion?.discountType || "").toUpperCase() === "FIXED" &&
    String(promotion?.fixedAmountApplyMode || "PER_ITEM").toUpperCase() === "TOTAL"
  );
}

function calculatePromotionAmount(promotion, baseAmount) {
  const safeBaseAmount = Math.max(0, normalizeAmount(baseAmount, 0));
  const safeDiscountValue = Math.max(0, normalizeAmount(promotion?.discountValue, 0));

  if (safeBaseAmount <= 0 || safeDiscountValue <= 0) {
    return 0;
  }

  if (String(promotion?.discountType || "").toUpperCase() === "PERCENTAGE") {
    return (safeBaseAmount * safeDiscountValue) / 100;
  }

  return safeDiscountValue;
}

async function resolveDraftContext({ cartProducts, siteKey }) {
  const normalizedSiteKey = normalizePublicSite(siteKey);

  if (!Array.isArray(cartProducts) || cartProducts.length === 0) {
    return { errors: ["Your cart is empty."] };
  }

  const requestedQuantities = new Map();
  const invalidProductIds = [];

  for (const item of cartProducts) {
    const productId = resolveCartProductId(item);
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      invalidProductIds.push(productId || "unknown");
      continue;
    }

    const quantity = normalizeQuantity(item.quantity || item.qty || 1);
    requestedQuantities.set(productId, (requestedQuantities.get(productId) || 0) + quantity);
  }

  if (!requestedQuantities.size) {
    return { errors: ["Your cart does not contain valid products."] };
  }

  if (invalidProductIds.length) {
    return { errors: ["One or more items in your cart are invalid. Please refresh your cart and try again."] };
  }

  const productIds = [...requestedQuantities.keys()].map(
    (productId) => new mongoose.Types.ObjectId(productId)
  );

  const products = await Product.find({ _id: { $in: productIds } }).lean();
  const productsById = new Map(products.map((product) => [String(product._id), product]));
  const orderItems = [];
  const itemErrors = [];

  for (const [productId, quantity] of requestedQuantities.entries()) {
    const product = productsById.get(productId);
    if (!product) {
      itemErrors.push("One or more products in your cart are no longer available.");
      continue;
    }

    if (!productMatchesPublicSite(product, normalizedSiteKey)) {
      itemErrors.push(`${product.name} is not available in this site catalog.`);
      continue;
    }

    const availableQuantity = getAvailableInventoryQuantity(product);
    if (availableQuantity <= 0) {
      itemErrors.push(`${product.name} is out of stock.`);
      continue;
    }

    if (availableQuantity < quantity) {
      itemErrors.push(`Only ${availableQuantity} unit(s) of ${product.name} are available.`);
      continue;
    }

    const imageSnapshots = normalizeProductImages(product.images).map((image) => image.full);

    orderItems.push({
      productId: product._id,
      quantity,
      price: product.salePriceIncTax || 0,
      name: product.name,
      category: product.category || "N/A",
      description: product.description || "",
      images: imageSnapshots,
    });
  }

  if (itemErrors.length) {
    return { errors: itemErrors };
  }

  const orderLocation = await resolveSiteOrderLocation(normalizedSiteKey);

  return {
    normalizedSiteKey,
    orderItems,
    orderLocation,
  };
}

async function getActiveOnlinePromotions() {
  const now = new Date();

  const promotions = await Promotion.find({
    active: true,
    targetCustomerTypes: ONLINE_CUSTOMER_TYPE,
    startDate: { $lte: now },
    $and: [
      {
        $or: [
          { indefinite: true },
          { endDate: { $gte: now } },
        ],
      },
      {
        $or: [
          { maxUses: null },
          { maxUses: { $exists: false } },
          { $expr: { $lt: ["$timesUsed", "$maxUses"] } },
        ],
      },
    ],
  }).lean();

  return sortPromotions(promotions);
}

async function buildPromotionCategoryMap(promotions = []) {
  const categoryIds = [
    ...new Set(
      promotions
        .flatMap((promotion) =>
          Array.isArray(promotion?.categories)
            ? promotion.categories.map((categoryId) => normalizeObjectIdString(categoryId))
            : []
        )
        .filter(Boolean)
    ),
  ];

  if (!categoryIds.length) {
    return new Map();
  }

  const categories = await Category.find({
    _id: { $in: categoryIds.map((categoryId) => new mongoose.Types.ObjectId(categoryId)) },
  })
    .select("name")
    .lean();

  return new Map(
    categories.map((category) => [String(category._id), normalizeCategoryValue(category.name)])
  );
}

function promotionAppliesToItem({ promotion, item, categoryNameMap }) {
  const applicationType = String(promotion?.applicationType || "ALL_PRODUCTS").toUpperCase();
  const itemProductId = normalizeObjectIdString(item?.productId);
  const itemCategory = normalizeCategoryValue(item?.category);

  if (applicationType === "ALL_PRODUCTS") {
    return true;
  }

  if (applicationType === "ONE_PRODUCT") {
    return Array.isArray(promotion?.products) && promotion.products.some((productId) => {
      return normalizeObjectIdString(productId) === itemProductId;
    });
  }

  if (applicationType === "CATEGORY") {
    return Array.isArray(promotion?.categories) && promotion.categories.some((categoryId) => {
      const normalizedCategoryId = normalizeObjectIdString(categoryId);
      const categoryName = normalizeCategoryValue(categoryNameMap.get(normalizedCategoryId));

      return Boolean(
        itemCategory && (
          normalizedCategoryId === itemCategory ||
          categoryName === itemCategory
        )
      );
    });
  }

  return false;
}

async function buildPricingQuote({ orderItems, destination }) {
  const activePromotions = await getActiveOnlinePromotions();
  const categoryNameMap = await buildPromotionCategoryMap(activePromotions);
  const matchedCartDiscountPromotions = [];
  const matchedCartIncrementPromotions = [];
  const appliedDiscounts = [];
  const appliedIncrements = [];

  const baseSubtotal = orderItems.reduce((runningTotal, item) => {
    return runningTotal + normalizeAmount(item.price, 0) * normalizeQuantity(item.quantity || item.qty || 1);
  }, 0);

  let discountedSubtotal = 0;
  let shippingCost = 0;

  const adjustedItems = orderItems.map((item) => {
    const quantity = normalizeQuantity(item.quantity || item.qty || 1);
    const unitPrice = normalizeAmount(item.price, 0);
    const matchingPromotions = activePromotions.filter((promotion) => {
      return promotionAppliesToItem({ promotion, item, categoryNameMap });
    });

    const itemDiscountPromotion = matchingPromotions.find((promotion) => {
      return (
        String(promotion?.valueType || "DISCOUNT").toUpperCase() === "DISCOUNT" &&
        !isFixedTotalPromotion(promotion)
      );
    });

    const unitDiscount = itemDiscountPromotion
      ? Math.min(unitPrice, calculatePromotionAmount(itemDiscountPromotion, unitPrice))
      : 0;
    const adjustedUnitPrice = Math.max(0, unitPrice - unitDiscount);

    if (itemDiscountPromotion && unitDiscount > 0) {
      appliedDiscounts.push({
        name: itemDiscountPromotion.name || "Online campaign discount",
        amount: unitDiscount * quantity,
      });
    }

    const itemIncrementPromotions = matchingPromotions.filter((promotion) => {
      return (
        String(promotion?.valueType || "DISCOUNT").toUpperCase() === "INCREMENT" &&
        !isFixedTotalPromotion(promotion)
      );
    });

    for (const promotion of itemIncrementPromotions) {
      const incrementAmount = calculatePromotionAmount(promotion, unitPrice) * quantity;
      if (incrementAmount <= 0) {
        continue;
      }

      shippingCost += incrementAmount;
      appliedIncrements.push({
        name: promotion.name || "Online delivery fee",
        amount: incrementAmount,
      });
    }

    discountedSubtotal += adjustedUnitPrice * quantity;

    matchingPromotions.forEach((promotion) => {
      if (!isFixedTotalPromotion(promotion)) {
        return;
      }

      if (String(promotion?.valueType || "DISCOUNT").toUpperCase() === "DISCOUNT") {
        matchedCartDiscountPromotions.push(promotion);
        return;
      }

      matchedCartIncrementPromotions.push(promotion);
    });

    return {
      ...item,
      quantity,
      price: adjustedUnitPrice,
    };
  });

  const cartDiscountPromotion = dedupePromotions(matchedCartDiscountPromotions)[0] || null;
  const cartDiscount = cartDiscountPromotion
    ? Math.min(discountedSubtotal, calculatePromotionAmount(cartDiscountPromotion, discountedSubtotal))
    : 0;

  if (cartDiscountPromotion && cartDiscount > 0) {
    appliedDiscounts.push({
      name: cartDiscountPromotion.name || "Online campaign discount",
      amount: cartDiscount,
    });
  }

  const cartIncrement = dedupePromotions(matchedCartIncrementPromotions).reduce((runningTotal, promotion) => {
    const incrementAmount = calculatePromotionAmount(promotion, discountedSubtotal);

    if (incrementAmount > 0) {
      appliedIncrements.push({
        name: promotion.name || "Online delivery fee",
        amount: incrementAmount,
      });
    }

    return runningTotal + incrementAmount;
  }, 0);

  shippingCost += cartIncrement;

  const subtotal = Math.max(0, discountedSubtotal - cartDiscount);
  const discountTotal = Math.max(0, baseSubtotal - subtotal);
  const total = subtotal + shippingCost;

  return {
    orderItems: adjustedItems,
    baseSubtotal,
    subtotal,
    discountTotal,
    shippingCost,
    total,
    shippingQuote: {
      destination: cleanText(destination) || "Selected destination",
      cost: shippingCost,
      isFallback: false,
      waived: shippingCost <= 0,
      source: "ONLINE_PROMOTIONS",
    },
    promotionSummary: {
      appliedDiscounts,
      appliedIncrements,
    },
  };
}

export async function buildOrderQuote({ cartProducts, siteKey, destination = "" }) {
  const draftContext = await resolveDraftContext({ cartProducts, siteKey });
  if (draftContext.errors?.length) {
    return draftContext;
  }

  const pricing = await buildPricingQuote({
    orderItems: draftContext.orderItems,
    destination,
  });

  return {
    siteKey: draftContext.normalizedSiteKey,
    locationId: draftContext.orderLocation.locationId,
    locationName: draftContext.orderLocation.locationName,
    ...pricing,
  };
}

export async function buildOrderDraft({ customer, cartProducts, siteKey }) {
  const normalizedCustomer = normalizeCustomer(customer);
  const customerErrors = validateCustomer(normalizedCustomer);
  if (customerErrors.length) {
    return { errors: customerErrors };
  }

  const draftContext = await resolveDraftContext({ cartProducts, siteKey });
  if (draftContext.errors?.length) {
    return draftContext;
  }

  const pricing = await buildPricingQuote({
    orderItems: draftContext.orderItems,
    destination: normalizedCustomer.city,
  });

  return {
    siteKey: draftContext.normalizedSiteKey,
    customer: normalizedCustomer,
    locationId: draftContext.orderLocation.locationId,
    locationName: draftContext.orderLocation.locationName,
    orderItems: pricing.orderItems,
    baseSubtotal: pricing.baseSubtotal,
    subtotal: pricing.subtotal,
    discountTotal: pricing.discountTotal,
    shippingCost: pricing.shippingCost,
    total: pricing.total,
    shippingQuote: pricing.shippingQuote,
    promotionSummary: pricing.promotionSummary,
  };
}