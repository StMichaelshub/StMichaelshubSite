import { isMongoConnectionError, mongooseConnect } from "@/lib/mongoose";
import { getAuthenticatedCustomerFromRequest } from "@/lib/customerAuth";
import { releaseExpiredReservations } from "@/lib/orderLifecycle";
import Order from "@/models/Order";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const connection = await mongooseConnect({ allowFailure: true });
  if (!connection) {
    return res.status(200).json({ authenticated: false, databaseAvailable: false });
  }

  try {
    await releaseExpiredReservations();

    const customer = await getAuthenticatedCustomerFromRequest(req);
    if (!customer) {
      return res.status(200).json({ authenticated: false, databaseAvailable: true });
    }

    const orders = await Order.find({ customer: customer._id })
      .sort({ createdAt: -1 })
      .populate("items.productId");

    return res.status(200).json({
      authenticated: true,
      customer,
      orders,
      databaseAvailable: true,
    });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return res.status(200).json({ authenticated: false, databaseAvailable: false });
    }

    console.error("Account session error:", error);
    return res.status(500).json({ message: "Failed to load account session." });
  }
}