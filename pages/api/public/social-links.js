import { getSiteSocialLinks } from "@/lib/socialContent";
import { PUBLIC_SITE_KEYS, normalizePublicSite } from "@/lib/publicSite";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const siteKey = normalizePublicSite(req.query.site || PUBLIC_SITE_KEYS.STORE);
    const socialLinks = await getSiteSocialLinks(siteKey);
    return res.status(200).json({ socialLinks });
  } catch (error) {
    console.error("Public social links API error:", error);
    return res.status(500).json({ error: "Server error", socialLinks: [] });
  }
}
