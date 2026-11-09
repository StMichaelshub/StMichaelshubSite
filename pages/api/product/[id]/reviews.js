import mongoose from "mongoose";
import { mongooseConnect } from "@/lib/mongoose";
import { Product } from "@/models/Product";
import { getAuthenticatedCustomerFromRequest } from "@/lib/customerAuth";

const MAX_TITLE_LENGTH = 120;
const MAX_TEXT_LENGTH = 2000;
const MAX_NAME_LENGTH = 80;

// Light spam guard: a few reviews per visitor per hour. Per server instance only,
// so it slows abuse down rather than stopping a determined attacker.
const REVIEW_WINDOW_MS = 60 * 60 * 1000;
const MAX_REVIEWS_PER_WINDOW = 5;
const recentReviewsByVisitor = new Map();

function getVisitorKey(req) {
  return String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
}

function isRateLimited(visitorKey) {
  const now = Date.now();
  const recent = (recentReviewsByVisitor.get(visitorKey) || []).filter((time) => now - time < REVIEW_WINDOW_MS);
  if (recent.length >= MAX_REVIEWS_PER_WINDOW) {
    recentReviewsByVisitor.set(visitorKey, recent);
    return true;
  }
  recent.push(now);
  recentReviewsByVisitor.set(visitorKey, recent);
  return false;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await mongooseConnect();
  const { id } = req.query;

  if (!id || !mongoose.Types.ObjectId.isValid(String(id))) {
    return res.status(404).json({ error: "Product not found" });
  }

  const { title, text, rating, customerName } = req.body || {};
  const normalizedTitle = typeof title === "string" ? title.trim() : "";
  const normalizedText = typeof text === "string" ? text.trim() : "";
  const normalizedRating = Math.round(Number(rating));

  if (!normalizedTitle || !normalizedText || !normalizedRating) {
    return res.status(400).json({ error: "Missing fields" });
  }

  if (normalizedRating < 1 || normalizedRating > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }

  if (normalizedTitle.length > MAX_TITLE_LENGTH || normalizedText.length > MAX_TEXT_LENGTH) {
    return res.status(400).json({
      error: `Keep the title under ${MAX_TITLE_LENGTH} characters and the review under ${MAX_TEXT_LENGTH}.`,
    });
  }

  if (isRateLimited(getVisitorKey(req))) {
    return res.status(429).json({ error: "Too many reviews in a short time. Please try again later." });
  }

  // Only a signed-in customer's id is attached; a customer id sent in the form is ignored.
  const sessionCustomer = await getAuthenticatedCustomerFromRequest(req);
  const typedName = typeof customerName === "string" ? customerName.trim().slice(0, MAX_NAME_LENGTH) : "";

  const review = {
    title: normalizedTitle,
    text: normalizedText,
    rating: normalizedRating,
    customerName: sessionCustomer?.name || typedName || "Anonymous",
    ...(sessionCustomer ? { customerId: sessionCustomer._id } : {}),
    createdAt: new Date(),
  };

  // $push only touches the reviews array, so it cannot clash with stock updates.
  const result = await Product.updateOne(
    { _id: id, isArchived: { $ne: true } },
    { $push: { reviews: review } }
  );

  if (!result.matchedCount) {
    return res.status(404).json({ error: "Product not found" });
  }

  return res.status(200).json({ message: "Review added", review });
}
