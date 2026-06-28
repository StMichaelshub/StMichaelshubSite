import {
  getStorefrontProductById,
  getStorefrontProducts,
  getStorefrontProductsByIds,
} from "@/lib/storefrontCatalog";

export default async function handle(req, res) {
  const { method } = req;

  if (method === "GET") {
    if (req.query?.id) {
      try {
        const resolvedProduct = await getStorefrontProductById(req.query.id, {
          site: req.query?.siteKey,
        });
        if (!resolvedProduct) {
          return res.status(404).json({ success: false, message: "Product not found" });
        }
        return res.json(resolvedProduct);
      } catch (error) {
        console.error("Error fetching product:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch this product" });
      }
    } else {
      try {
        const resolvedProducts = await getStorefrontProducts({ site: req.query?.siteKey });
        return res.json(resolvedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch products" });
      }
    }
  } 
  else if (method === "POST") {
    // Fetch multiple products by array of ids
    try {
      const { ids, siteKey } = req.body;
      if (!Array.isArray(ids)) {
        return res.status(400).json({ success: false, message: "Invalid 'ids' array" });
      }
      if (!ids.length) {
        return res.json({ products: [] });
      }
      const resolvedProducts = await getStorefrontProductsByIds(ids, { site: siteKey });
      return res.json({ products: resolvedProducts });
    } catch (error) {
      console.error("Error fetching multiple products:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch products" });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
