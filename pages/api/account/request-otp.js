import { isMongoConnectionError, mongooseConnect } from "@/lib/mongoose";
import Customer from "@/models/Customer";
import {
  createLoginOtp,
  deliverLoginOtp,
  maskEmailAddress,
  normalizeCustomerEmail,
} from "@/lib/customerAuth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    await mongooseConnect();

    const email = normalizeCustomerEmail(req.body.email);
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";

    if (!email) {
      return res.status(400).json({ message: "Email address is required." });
    }

    const customer = await Customer.findOneAndUpdate(
      { email },
      {
        $set: {
          ...(name ? { name } : {}),
          type: "ONLINE",
        },
        $setOnInsert: {
          email,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    const otpPayload = await createLoginOtp(customer);
    const delivery = await deliverLoginOtp({ customer, code: otpPayload.code });

    return res.status(200).json({
      success: true,
      message: "A sign-in code has been sent if the email is available.",
      expiresInMinutes: otpPayload.expiresInMinutes,
      delivery: delivery.method,
      deliveryTarget: delivery.target || email,
      maskedDeliveryTarget: maskEmailAddress(delivery.target || email),
      ...(process.env.NODE_ENV !== "production"
        ? { debugOtp: otpPayload.code }
        : {}),
    });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return res.status(503).json({
        message: "Account sign-in is temporarily unavailable. Please try again shortly.",
      });
    }

    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      message:
        error.message || "We could not send a sign-in code right now.",
    });
  }
}