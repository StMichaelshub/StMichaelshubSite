import { getStorefrontProductsByIds } from "@/lib/storefrontCatalog";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { ids, siteKey } = req.body;

  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: "Invalid or missing 'ids' array" });
  }

  try {
    if (!ids.length) {
      return res.status(200).json({ products: [] });
    }

    const products = await getStorefrontProductsByIds(ids, { site: siteKey });
    res.status(200).json({ products });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
