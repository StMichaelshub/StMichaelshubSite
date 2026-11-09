import Customer from "@/models/Customer";
import Order from "@/models/Order";
import { getAuthenticatedCustomerFromRequest, normalizeCustomerEmail } from "@/lib/customerAuth";

// Unpaid orders hold stock. Cap how many one email address can have open at once
// so nobody can lock up the catalogue with orders they never pay for.
export const MAX_OPEN_UNPAID_ORDERS_PER_EMAIL = 3;

/**
 * Finds or creates the customer record for a checkout.
 *
 * A signed-in customer may update their own saved details. A guest checkout
 * never overwrites an existing customer's saved name, phone, address or type
 * (the Customer collection is shared with the POS, including credit customers);
 * the order keeps the details typed at checkout as its own snapshot.
 */
export async function resolveCheckoutCustomer(req, draftCustomer) {
  const email = normalizeCustomerEmail(draftCustomer?.email);
  const sessionCustomer = await getAuthenticatedCustomerFromRequest(req);

  if (sessionCustomer && normalizeCustomerEmail(sessionCustomer.email) === email) {
    return Customer.findByIdAndUpdate(
      sessionCustomer._id,
      { $set: { ...draftCustomer, email } },
      { new: true }
    );
  }

  return Customer.findOneAndUpdate(
    { email },
    { $setOnInsert: { ...draftCustomer, email, type: "ONLINE" } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

/** Customer details for this order: what was typed at checkout, linked to the stored customer. */
export function buildOrderCustomer(storedCustomer, draftCustomer) {
  return {
    ...draftCustomer,
    _id: storedCustomer._id,
    email: normalizeCustomerEmail(draftCustomer?.email || storedCustomer.email),
    type: "ONLINE",
  };
}

export async function assertCanOpenAnotherOrder(email) {
  const openUnpaidOrders = await Order.countDocuments({
    "customerSnapshot.email": normalizeCustomerEmail(email),
    paid: false,
    reservationStatus: "active",
  });

  if (openUnpaidOrders >= MAX_OPEN_UNPAID_ORDERS_PER_EMAIL) {
    const error = new Error(
      `You already have ${openUnpaidOrders} unpaid orders. Please complete or wait for one of them before placing another.`
    );
    error.statusCode = 429;
    throw error;
  }
}
