import { mongooseConnect } from "@/lib/mongoose";
import { Product } from "@/models/Product";

export default async function handler(req, res) {
  await mongooseConnect();
  const { id } = req.query;

  if (req.method === "POST") {
    const { title, text, rating, customerName, customerId } = req.body;
    const normalizedTitle = typeof title === "string" ? title.trim() : "";
    const normalizedText = typeof text === "string" ? text.trim() : "";
    const normalizedCustomerName =
      typeof customerName === "string" ? customerName.trim() : "Anonymous";
    const normalizedRating = Number(rating);

    if (!normalizedTitle || !normalizedText || !normalizedRating) {
      return res.status(400).json({ error: "Missing fields" });
    }

    if (normalizedRating < 1 || normalizedRating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const review = {
      title: normalizedTitle,
      text: normalizedText,
      rating: normalizedRating,
      customerName: normalizedCustomerName || "Anonymous",
      customerId,
      createdAt: new Date(),
    };

    product.reviews.push(review);
    await product.save();

    res.status(200).json({ message: "Review added", review });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
