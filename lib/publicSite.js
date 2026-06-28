export const PUBLIC_SITE_KEYS = {
  STORE: "store",
  HOTEL: "hotel",
};

const SITE_LOCATION_TOKENS = {
  [PUBLIC_SITE_KEYS.STORE]: ["warehouse", "store"],
  [PUBLIC_SITE_KEYS.HOTEL]: ["hotel"],
};

const HOTEL_PUBLIC_LABEL_OVERRIDES = {
  "/contact": "Contact Reservations",
  "/shipping-policy": "Guest Service Policy",
  "/returns-and-refunds": "Reservation Changes & Refunds",
  "/terms-of-service": "Guest Terms of Service",
};

export const PUBLIC_SITE_CONFIGS = {
  [PUBLIC_SITE_KEYS.STORE]: {
    key: PUBLIC_SITE_KEYS.STORE,
    label: "Store",
    shortLabel: "Store",
    displayName: "St Michael's Food & Drinks Warehouse",
    tagLine: "Groceries, drinks, and essentials",
    topBarCopy: "Shop groceries, drinks, and everyday essentials in one easy storefront",
    topBarCta: "Shop now",
    topBarCtaHref: "/products",
    heroEyebrow: "Everyday essentials",
    heroTitle: "Clear stock. Fair pricing. Faster ordering for home and business.",
    heroDescription:
      "Shop groceries, pantry staples, drinks, and everyday essentials in one simple storefront with clear pricing and easy checkout.",
    heroHighlights: [
      "Easy ordering",
      "Helpful delivery updates",
    ],
    featuredProductLabel: "Featured item",
    secondaryCtaLabel: "Browse Categories",
    listingEyebrow: "Store collection",
    listingTitle: "Store Products",
    listingDescription:
      "Filter warehouse products by category, search by keyword, and find what you need faster.",
    categoryEyebrow: "Shop by aisle",
    categoryTitle: "Shop Store Categories",
    categoryDescription:
      "Browse categories, use live search, and jump straight to what you want.",
    emptyCatalogMessage: "Products will appear here soon.",
    navLinks: [
      { href: "/", label: "Home" },
      { href: "/products", label: "All Products" },
      { href: "/categories", label: "Categories" },
      { href: "/account", label: "Account" },
    ],
    primaryFooterLinks: [
      { href: "/", label: "St Michael's Home" },
      { href: "/store", label: "Store" },
      { href: "/hotel", label: "Hotel" },
      { href: "/account", label: "Customer Account" },
    ],
    serviceHighlights: [
      "Order help",
      "Store contact details",
      "Delivery and policy information",
    ],
    showCart: true,
    contactPanelTitle: "Reach the store",
  },
  [PUBLIC_SITE_KEYS.HOTEL]: {
    key: PUBLIC_SITE_KEYS.HOTEL,
    label: "Hotel",
    shortLabel: "Hotel",
    displayName: "St Michael's Hotel",
    tagLine: "Rooms, lounge, and reservations",
    topBarCopy: "Boutique rooms, lounge dining, and direct reservation support",
    topBarCta: "Book a stay",
    topBarCtaHref: "/booking",
    heroEyebrow: "Boutique hotel & lounge",
    heroTitle: "Rest well, dine easy, and book your stay directly.",
    heroDescription:
      "Discover guest rooms, lounge dining, and direct reservation support built for a calmer hotel experience instead of a shopping cart flow.",
    heroHighlights: [
      "Direct reservation desk",
      "Rooms and lounge access",
    ],
    featuredProductLabel: "Signature room",
    secondaryCtaLabel: "Explore Rooms",
    listingEyebrow: "Rooms and suites",
    listingTitle: "Hotel Rooms",
    listingDescription:
      "Compare room types, nightly rates, occupancy, and included comforts before sending a booking request.",
    categoryEyebrow: "Lounge and dining",
    categoryTitle: "Hotel Lounge",
    categoryDescription:
      "Browse lounge plates, breakfast service, and signature drinks without stock counters or cart controls.",
    emptyCatalogMessage: "Rooms and lounge selections are being prepared.",
    navLinks: [
      { href: "/", label: "Home" },
      { href: "/rooms", label: "Rooms" },
      { href: "/lounge", label: "Lounge" },
      { href: "/booking", label: "Book a stay" },
      { href: "/reserve-table", label: "Reserve a table" },
      { href: "/manage-bookings", label: "Manage bookings" },
    ],
    primaryFooterLinks: [
      { href: "/", label: "St Michael's Home" },
      { href: "/rooms", label: "Rooms & Suites" },
      { href: "/lounge", label: "Lounge & Dining" },
      { href: "/booking", label: "Book a stay" },
      { href: "/reserve-table", label: "Reserve a table" },
      { href: "/manage-bookings", label: "Manage bookings" },
    ],
    serviceHighlights: [
      "Direct room booking requests",
      "Flexible arrival coordination",
      "Lounge dining and guest support",
    ],
    showCart: false,
    contactPanelTitle: "Reach reservations",
  },
};

function normalizeTextToken(value) {
  return typeof value === "string"
    ? value.trim().toLowerCase().replace(/[^a-z0-9]/g, "")
    : "";
}

export function normalizePublicSite(siteKey) {
  return siteKey === PUBLIC_SITE_KEYS.HOTEL ? PUBLIC_SITE_KEYS.HOTEL : PUBLIC_SITE_KEYS.STORE;
}

export function getPublicSiteConfig(siteKey) {
  return PUBLIC_SITE_CONFIGS[normalizePublicSite(siteKey)];
}

export function getPublicSiteLocationTokens(siteKey) {
  return [...(SITE_LOCATION_TOKENS[normalizePublicSite(siteKey)] || [])];
}

export function inferPublicSiteFromPath(pathname = "") {
  if (typeof pathname !== "string") {
    return null;
  }

  if (pathname === "/hotel" || pathname.startsWith("/hotel/")) {
    return PUBLIC_SITE_KEYS.HOTEL;
  }

  if (pathname === "/store" || pathname.startsWith("/store/")) {
    return PUBLIC_SITE_KEYS.STORE;
  }

  return null;
}

export function getPublicSiteBasePath(siteKey) {
  return `/${normalizePublicSite(siteKey)}`;
}

export function getPublicSitePath(siteKey, suffix = "") {
  const basePath = getPublicSiteBasePath(siteKey);

  if (!suffix || suffix === "/") {
    return basePath;
  }

  return `${basePath}${suffix.startsWith("/") ? suffix : `/${suffix}`}`;
}

export function getPublicScopedHref(siteKey, href = "/") {
  if (typeof href !== "string" || !href) {
    return getPublicSitePath(siteKey);
  }

  if (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("#") ||
    href.startsWith("/api/") ||
    href === "/store" ||
    href === "/hotel" ||
    href.startsWith("/store/") ||
    href.startsWith("/hotel/")
  ) {
    return href;
  }

  if (href === "/") {
    return getPublicSitePath(siteKey);
  }

  return getPublicSitePath(siteKey, href);
}

export function getPublicSiteLinkLabel(siteKey, href, fallbackLabel) {
  if (normalizePublicSite(siteKey) === PUBLIC_SITE_KEYS.HOTEL && HOTEL_PUBLIC_LABEL_OVERRIDES[href]) {
    return HOTEL_PUBLIC_LABEL_OVERRIDES[href];
  }

  return fallbackLabel;
}

export function getPublicProductPath(siteKey, productId) {
  return getPublicSitePath(siteKey, `/product/${productId}`);
}

export function getPublicOrderConfirmationPath(siteKey, orderId) {
  return getPublicSitePath(siteKey, `/checkout/order-confirmation/${orderId}`);
}

export function getNormalizedProductLocations(product) {
  return (Array.isArray(product?.locations) ? product.locations : [])
    .map(normalizeTextToken)
    .filter(Boolean);
}

export function productMatchesPublicSite(product, siteKey) {
  if (!siteKey) {
    return true;
  }

  const normalizedSite = normalizePublicSite(siteKey);
  const locations = getNormalizedProductLocations(product);
  const acceptedTokens = SITE_LOCATION_TOKENS[normalizedSite] || [];

  if (!locations.length || !acceptedTokens.length) {
    return false;
  }

  return locations.some((location) =>
    acceptedTokens.some((acceptedToken) => location.includes(acceptedToken))
  );
}

export function filterProductsForPublicSite(products = [], siteKey) {
  if (!siteKey) {
    return [...products];
  }

  return products.filter((product) => productMatchesPublicSite(product, siteKey));
}