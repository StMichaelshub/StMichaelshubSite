import { mongooseConnect } from "@/lib/mongoose";
import Order from "@/models/Order";
import { requireAuthenticatedCustomer } from "@/lib/customerAuth";
import { releaseExpiredReservations } from "@/lib/orderLifecycle";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  await mongooseConnect();
  await releaseExpiredReservations();

  try {
    const customer = await requireAuthenticatedCustomer(req, res);
    if (!customer) {
      return;
    }

    const orders = await Order.find({ customer: customer._id })
      .sort({ createdAt: -1 })
      .populate("items.productId");

    return res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders by email:", error);
    return res.status(500).json({ message: "Server Error" });
  }
}
