import { isMongoConnectionError, mongooseConnect } from "@/lib/mongoose";
import {
  consumeLoginOtp,
  normalizeCustomerEmail,
  setCustomerSessionCookie,
} from "@/lib/customerAuth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    await mongooseConnect();

    const email = normalizeCustomerEmail(req.body.email);
    const code = typeof req.body.code === "string" ? req.body.code.trim() : "";

    if (!email || !code) {
      return res.status(400).json({ message: "Email and code are required." });
    }

    const customer = await consumeLoginOtp({ email, code });
    if (!customer) {
      return res.status(401).json({ message: "Invalid or expired sign-in code." });
    }

    setCustomerSessionCookie(res, customer);

    return res.status(200).json({
      success: true,
      customer: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        type: customer.type,
      },
    });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return res.status(503).json({
        message: "Account sign-in verification is temporarily unavailable. Please try again shortly.",
      });
    }

    return res.status(error.statusCode || 500).json({
      message: error.message || "We could not verify the sign-in code right now.",
    });
  }
}