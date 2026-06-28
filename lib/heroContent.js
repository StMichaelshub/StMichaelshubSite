import Hero from "@/models/Hero";
import "@/models/Promotion";
import { mongooseConnect } from "@/lib/mongoose";
import { PUBLIC_SITE_KEYS, normalizePublicSite } from "@/lib/publicSite";
import { getSiteSocialLinks } from "@/lib/socialContent";

const SITE_TO_HERO_SYSTEM = {
  [PUBLIC_SITE_KEYS.STORE]: "ecommerce",
  [PUBLIC_SITE_KEYS.HOTEL]: "web",
};

function parseScheduleDate(value, endOfDay = false) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (endOfDay && date.getUTCHours() === 0 && date.getUTCMinutes() === 0 && date.getUTCSeconds() === 0 && date.getUTCMilliseconds() === 0) {
    date.setUTCHours(23, 59, 59, 999);
  }
  return date;
}

function isDateInRange(startDate, endDate, now) {
  const startsAt = parseScheduleDate(startDate);
  const endsAt = parseScheduleDate(endDate, true);
  return (!startsAt || startsAt <= now) && (!endsAt || endsAt >= now);
}

function isLinkedScheduleActive(hero, now) {
  if (hero.bannerType === "promotion" || (hero.bannerType === "campaign" && hero.linkedPromotion)) {
    const promotion = hero.linkedPromotion;
    if (!promotion || promotion.active === false) return false;
    return promotion.indefinite || isDateInRange(promotion.startDate, promotion.endDate, now);
  }

  return isDateInRange(hero.startDate, hero.endDate, now);
}

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

function serializeImages(images) {
  return (Array.isArray(images) ? images : [])
    .map((image) => ({
      full: String(image?.full || "").trim(),
      thumb: String(image?.thumb || image?.full || "").trim(),
    }))
    .filter((image) => image.full && image.thumb);
}

function serializeHero(hero) {
  return {
    _id: String(hero._id),
    title: hero.title || "",
    subtitle: hero.subtitle || "",
    image: serializeImages(hero.image),
    bgImage: serializeImages(hero.bgImage),
    ctaText: hero.ctaText || "",
    ctaLink: hero.ctaLink || "",
    targetSystem: hero.targetSystem || "ecommerce",
    bannerType: hero.bannerType || "standard",
    linkedPromotion: hero.linkedPromotion
      ? {
          _id: String(hero.linkedPromotion._id),
          name: hero.linkedPromotion.name || "",
          description: hero.linkedPromotion.description || "",
          valueType: hero.linkedPromotion.valueType || "DISCOUNT",
          discountType: hero.linkedPromotion.discountType || "PERCENTAGE",
          discountValue: hero.linkedPromotion.discountValue || 0,
          applicationType: hero.linkedPromotion.applicationType || "ALL_PRODUCTS",
          products: Array.isArray(hero.linkedPromotion.products) ? hero.linkedPromotion.products.map(String) : [],
          categories: Array.isArray(hero.linkedPromotion.categories) ? hero.linkedPromotion.categories.map(String) : [],
          startDate: hero.linkedPromotion.startDate?.toISOString?.() || null,
          endDate: hero.linkedPromotion.endDate?.toISOString?.() || null,
          indefinite: Boolean(hero.linkedPromotion.indefinite),
          active: hero.linkedPromotion.active !== false,
        }
      : null,
    startDate: hero.startDate?.toISOString?.() || null,
    endDate: hero.endDate?.toISOString?.() || null,
    socialLinks: (hero.socialLinks || []).map(normalizeSocialLink),
    order: hero.order || 0,
  };
}

export async function getHeroContentForSite(siteKey) {
  const normalizedSiteKey = normalizePublicSite(siteKey);
  const connection = await mongooseConnect({ allowFailure: true });

  if (!connection) {
    return { activeHero: null, secondaryHeroes: [], socialLinks: [] };
  }

  const heroSystem = SITE_TO_HERO_SYSTEM[normalizedSiteKey] || SITE_TO_HERO_SYSTEM[PUBLIC_SITE_KEYS.STORE];
  const heroes = await Hero.find({
    status: "active",
    targetSystem: { $in: [heroSystem, "both"] },
  })
    .populate("linkedPromotion", "name description valueType discountType discountValue applicationType products categories startDate endDate indefinite active")
    .sort({ order: 1, createdAt: -1 })
    .lean();

  const now = new Date();
  const activeHeroes = heroes.filter((hero) => isLinkedScheduleActive(hero, now)).map(serializeHero);
  const activeHero = activeHeroes.find((hero) => hero.bannerType === "standard") || null;
  const secondaryHeroes = activeHeroes.filter((hero) => hero.bannerType === "promotion" || hero.bannerType === "campaign");
  const socialLinks = await getSiteSocialLinks(normalizedSiteKey);

  return {
    activeHero,
    secondaryHeroes,
    socialLinks,
  };
}
