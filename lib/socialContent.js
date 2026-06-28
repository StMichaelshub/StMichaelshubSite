import Hero from "@/models/Hero";
import SiteSocialLink from "@/models/SiteSocialLink";
import { mongooseConnect } from "@/lib/mongoose";
import { PUBLIC_SITE_KEYS, normalizePublicSite } from "@/lib/publicSite";

const SITE_SOCIAL_SCOPES = {
  [PUBLIC_SITE_KEYS.STORE]: new Set(["warehouse", "both"]),
  [PUBLIC_SITE_KEYS.HOTEL]: new Set(["hotel", "both"]),
};

function normalizeSocialScope(value) {
  const scope = String(value || "").trim().toLowerCase();
  if (scope === "ecommerce" || scope === "store") return "warehouse";
  if (scope === "web" || scope === "all") return "both";
  return ["warehouse", "hotel", "both"].includes(scope) ? scope : "warehouse";
}

function normalizeSocialLink(link, index = 0) {
  return {
    platform: String(link?.platform || "").trim(),
    label: String(link?.label || "").trim(),
    handle: String(link?.handle || "").trim(),
    url: String(link?.url || "").trim(),
    scope: normalizeSocialScope(link?.scope),
    active: link?.active !== false,
    order: Number.isFinite(Number(link?.order)) ? Number(link.order) : index,
  };
}

function socialKey(link) {
  return [link.platform, link.url, link.handle, link.scope]
    .map((value) => String(value || "").trim().toLowerCase())
    .join("|");
}

function filterScopedSocialLinks(links, siteKey) {
  const normalizedSiteKey = normalizePublicSite(siteKey);
  const scopes = SITE_SOCIAL_SCOPES[normalizedSiteKey] || SITE_SOCIAL_SCOPES[PUBLIC_SITE_KEYS.STORE];
  const byKey = new Map();

  (Array.isArray(links) ? links : [])
    .map(normalizeSocialLink)
    .filter((link) => link.active !== false && scopes.has(link.scope) && (link.url || link.handle))
    .forEach((link) => {
      const key = socialKey(link);
      if (!byKey.has(key)) {
        byKey.set(key, link);
      }
    });

  return Array.from(byKey.values()).sort((left, right) => {
    if (left.order !== right.order) return left.order - right.order;
    return left.platform.localeCompare(right.platform);
  });
}

async function getLegacyHeroSocialLinks(siteKey) {
  const normalizedSiteKey = normalizePublicSite(siteKey);
  const targetSystem = normalizedSiteKey === PUBLIC_SITE_KEYS.HOTEL ? "web" : "ecommerce";
  const heroes = await Hero.find({
    status: "active",
    targetSystem: { $in: [targetSystem, "both"] },
    socialLinks: { $exists: true, $ne: [] },
  })
    .select("socialLinks order createdAt")
    .sort({ order: 1, createdAt: -1 })
    .lean();

  return filterScopedSocialLinks(heroes.flatMap((hero) => hero.socialLinks || []), normalizedSiteKey);
}

export async function getSiteSocialLinks(siteKey) {
  const connection = await mongooseConnect({ allowFailure: true });
  if (!connection) {
    return [];
  }

  const savedLinks = await SiteSocialLink.find({ active: true }).sort({ order: 1, createdAt: 1 }).lean();
  const scopedSavedLinks = filterScopedSocialLinks(savedLinks, siteKey);

  if (scopedSavedLinks.length > 0) {
    return scopedSavedLinks;
  }

  return getLegacyHeroSocialLinks(siteKey);
}
