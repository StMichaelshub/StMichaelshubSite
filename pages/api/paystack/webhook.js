import crypto from "crypto";
import { mongooseConnect } from "@/lib/mongoose";
import { finalizeOrderPayment, flagPaymentForReview } from "@/lib/orderLifecycle";

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const rawBody = await readRawBody(req);
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ message: "PAYSTACK_SECRET_KEY is not configured" });
  }

  const signature = crypto
    .createHmac("sha512", secretKey)
    .update(rawBody)
    .digest("hex");

  const received = Buffer.from(String(req.headers["x-paystack-signature"] || ""));
  const expected = Buffer.from(signature);
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
    return res.status(401).json({ message: "Invalid webhook signature" });
  }

  const event = JSON.parse(rawBody.toString("utf8"));
  await mongooseConnect();

  if (event.event === "charge.success") {
    const orderId = event.data?.metadata?.orderId;
    if (event.data?.currency && event.data.currency !== "NGN") {
      await flagPaymentForReview({
        orderId,
        reference: event.data.reference,
        amountInKobo: event.data.amount,
        reason: `Payment made in ${event.data.currency}, not NGN`,
      });
    } else if (orderId) {
      try {
        await finalizeOrderPayment({
          orderId,
          reference: event.data.reference,
          amountInKobo: event.data.amount,
          paymentStatus: event.data.status,
          paymentChannel: "paystack-webhook",
        });
      } catch (error) {
        // 400/404/409 are already flagged for review on the order; anything else is unexpected.
        if (![400, 404, 409].includes(error.statusCode)) {
          console.error("Paystack webhook finalization error:", error);
        }
      }
    }
  }

  return res.status(200).json({ received: true });
}