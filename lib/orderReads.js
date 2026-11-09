import Order from "@/models/Order";
import { releaseExpiredReservations } from "@/lib/orderLifecycle";
import { canViewOrder, PUBLIC_CUSTOMER_SELECT, PUBLIC_PRODUCT_SELECT } from "@/lib/orderAccess";

/**
 * Loads one order for a shopper. Returns { status, body } so each API route
 * responds the same way. Requires the order's access token or the owner's
 * session; anyone else gets "not found" so order ids cannot be probed.
 */
export async function loadOrderForShopper(req, { id, token }) {
  if (!id || Array.isArray(id)) {
    return { status: 400, body: { message: "Order id is required." } };
  }

  await releaseExpiredReservations();

  let order;
  try {
    order = await Order.findById(id)
      .populate({ path: "customer", select: PUBLIC_CUSTOMER_SELECT })
      .populate({ path: "items.productId", select: PUBLIC_PRODUCT_SELECT });
  } catch (error) {
    if (error?.name === "CastError") {
      return { status: 404, body: { message: "Order not found" } };
    }
    throw error;
  }

  if (!order || !(await canViewOrder(req, order, typeof token === "string" ? token : ""))) {
    return { status: 404, body: { message: "Order not found" } };
  }

  return { status: 200, body: order };
}
