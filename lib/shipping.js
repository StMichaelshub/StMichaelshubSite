import haversine from "haversine-distance";

export const STORE_LOCATION = { lat: 6.5244, lon: 3.3792 };
export const DEFAULT_BASE_SHIPPING_COST = 2000;
export const DEFAULT_SHIPPING_RATE_PER_KM = 100;
export const DEFAULT_FALLBACK_SHIPPING_COST = 2000;

export const SHIPPING_DESTINATIONS = {
  lagos: { label: "Lagos", lat: 6.5244, lon: 3.3792 },
  abuja: { label: "Abuja", lat: 9.0579, lon: 7.4951 },
  ibadan: { label: "Ibadan", lat: 7.3775, lon: 3.947 },
  portharcourt: { label: "Port Harcourt", lat: 4.8156, lon: 7.0498 },
};

export const SUPPORTED_SHIPPING_DESTINATIONS = Object.values(
  SHIPPING_DESTINATIONS
).map((destination) => destination.label);

function normalizeDestination(destination) {
  return typeof destination === "string"
    ? destination.toLowerCase().replace(/[^a-z]/g, "")
    : "";
}

function normalizeMoney(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function getShippingPricingConfig(store = {}) {
  const baseCost = normalizeMoney(store?.shippingBaseCost, DEFAULT_BASE_SHIPPING_COST);
  const perKmCost = normalizeMoney(store?.shippingRatePerKm, DEFAULT_SHIPPING_RATE_PER_KM);
  const fallbackCost = normalizeMoney(store?.shippingFallbackCost, baseCost);

  return {
    baseCost,
    perKmCost,
    fallbackCost: normalizeMoney(fallbackCost, DEFAULT_FALLBACK_SHIPPING_COST),
  };
}

export function getShippingQuote(destination, store = {}) {
  const pricing = getShippingPricingConfig(store);
  const normalizedDestination = normalizeDestination(destination);
  const customerLocation = SHIPPING_DESTINATIONS[normalizedDestination];

  if (!customerLocation) {
    return {
      cost: pricing.fallbackCost,
      baseCost: pricing.baseCost,
      perKmCost: pricing.perKmCost,
      distanceInKm: 0,
      destination:
        typeof destination === "string" && destination.trim()
          ? destination.trim()
          : "Unspecified destination",
      isFallback: true,
    };
  }

  const distanceInMeters = haversine(STORE_LOCATION, customerLocation);
  const distanceInKm = distanceInMeters / 1000;
  const cost = pricing.baseCost + Math.ceil(distanceInKm * pricing.perKmCost);

  return {
    cost,
    baseCost: pricing.baseCost,
    perKmCost: pricing.perKmCost,
    distanceInKm,
    destination: customerLocation.label,
    isFallback: false,
  };
}