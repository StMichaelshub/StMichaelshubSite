import { getSigningSecret, hmacBase64Url, safeEqual } from "@/lib/signingSecret";
import { getAuthenticatedCustomerFromRequest } from "@/lib/customerAuth";

/**
 * Store orders are private. The confirmation page link carries a signed token
 * tied to the order id, so only the person who placed the order (or the
 * signed-in customer who owns it) can see names, phone numbers and addresses.
 */
export function createOrderAccessToken(orderId) {
  return hmacBase64Url(getSigningSecret("order-access"), `order:${String(orderId)}`);
}

export function isValidOrderAccessToken(orderId, token) {
  if (!orderId || typeof token !== "string" || !token) return false;
  return safeEqual(createOrderAccessToken(orderId), token);
}

/** True when the request carries the order's token or comes from the customer who owns it. */
export async function canViewOrder(req, order, token) {
  if (!order) return false;
  if (isValidOrderAccessToken(order._id, token)) return true;

  const customer = await getAuthenticatedCustomerFromRequest(req);
  const ownerId = order.customer?._id || order.customer;
  return Boolean(customer && ownerId && String(customer._id) === String(ownerId));
}

/** Fields of a populated product that are safe to send to shoppers (no cost price or sales data). */
export const PUBLIC_PRODUCT_SELECT =
  "-costPrice -margin -salesHistory -totalRevenue -totalUnitsSold -lastSoldAt -vendors -minStock -maxStock";

export const PUBLIC_CUSTOMER_SELECT = "name email phone address city type";
