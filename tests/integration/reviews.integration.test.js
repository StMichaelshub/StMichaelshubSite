import { Product } from "@/models/Product";
import reviewHandler from "@/pages/api/product/[id]/reviews";
import { createApiMocks } from "./test-helpers";

describe("review submission", () => {
  it("stores a validated product review", async () => {
    const product = await Product.create({
      name: "Hotel Towels",
      description: "Soft hotel-grade towels.",
      costPrice: 3000,
      salePriceIncTax: 4500,
      quantity: 8,
      category: "Home",
      images: [
        {
          full: "/images/product-placeholder.svg",
          thumb: "/images/product-placeholder.svg",
        },
      ],
    });

    const { req, res } = createApiMocks({
      method: "POST",
      query: { id: String(product._id) },
      body: {
        title: "Worth it",
        text: "The quality is excellent and delivery was fast.",
        rating: 5,
        customerName: "Bola",
      },
    });

    await reviewHandler(req, res);

    expect(res.statusCode).toBe(200);

    const updatedProduct = await Product.findById(product._id).lean();
    expect(updatedProduct.reviews).toHaveLength(1);
    expect(updatedProduct.reviews[0]).toMatchObject({
      title: "Worth it",
      rating: 5,
      customerName: "Bola",
    });
  });
});