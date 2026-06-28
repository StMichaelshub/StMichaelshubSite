// pages/api/paystack/verify.js

import { mongooseConnect } from "@/lib/mongoose";
import axios from "axios";
import { finalizeOrderPayment } from "@/lib/orderLifecycle";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!secretKey) {
    return res.status(500).json({ error: "PAYSTACK_SECRET_KEY is not configured" });
  }

  await mongooseConnect();

  const { reference } = req.body;

  if (!reference) {
    return res.status(400).json({ error: "Missing reference" });
  }

  try {
    // Verify payment with Paystack
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      }
    );

    const data = response.data?.data;
    if (!data || data.status !== "success") {
      return res.status(400).json({ error: "Payment verification failed" });
    }

    const orderId = data.metadata?.orderId;
    if (!orderId) {
      return res.status(400).json({ error: "Missing order metadata" });
    }

    const result = await finalizeOrderPayment({
      orderId,
      reference: data.reference,
      amountInKobo: data.amount,
      paymentStatus: data.status,
      paymentChannel: data.channel || "paystack",
    });

    return res.json({ success: true, ...result });
  } catch (error) {
    console.error("Verify Error:", error);
    return res.status(error.statusCode || 500).json({
      error: error.message || "Internal Server Error",
    });
  }
}
