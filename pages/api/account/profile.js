import { mongooseConnect } from "@/lib/mongoose";
import Customer from "@/models/Customer";
import { requireAuthenticatedCustomer } from "@/lib/customerAuth";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  await mongooseConnect();

  const authenticatedCustomer = await requireAuthenticatedCustomer(req, res);
  if (!authenticatedCustomer) {
    return;
  }

  const payload = {
    name: typeof req.body.name === "string" ? req.body.name.trim() : "",
    phone: typeof req.body.phone === "string" ? req.body.phone.trim() : "",
    address:
      typeof req.body.address === "string" ? req.body.address.trim() : "",
    city: typeof req.body.city === "string" ? req.body.city.trim() : "",
  };

  const customer = await Customer.findByIdAndUpdate(
    authenticatedCustomer._id,
    {
      $set: {
        ...payload,
        type: "ONLINE",
      },
    },
    { new: true }
  );

  return res.status(200).json({
    success: true,
    customer,
  });
}