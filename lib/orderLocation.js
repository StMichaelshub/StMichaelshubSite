import Store from "@/models/Store";
import {
  getPublicSiteConfig,
  getPublicSiteLocationTokens,
  PUBLIC_SITE_KEYS,
  normalizePublicSite,
} from "@/lib/publicSite";

function normalizeToken(value) {
  return typeof value === "string"
    ? value.trim().toLowerCase().replace(/[^a-z0-9]/g, "")
    : "";
}

function getLocationMatchFields(location = {}) {
  return [location.name, location.code, location.address]
    .map(normalizeToken)
    .filter(Boolean);
}

function locationMatchesSite(location, siteKey) {
  const acceptedTokens = getPublicSiteLocationTokens(siteKey).map(normalizeToken);
  if (!acceptedTokens.length) {
    return false;
  }

  const locationFields = getLocationMatchFields(location);
  return locationFields.some((field) =>
    acceptedTokens.some((token) => field.includes(token))
  );
}

function getFallbackLocation(locations = [], siteKey) {
  if (!Array.isArray(locations) || locations.length === 0) {
    return null;
  }

  const hotelLikeLocations = locations.filter((location) =>
    locationMatchesSite(location, PUBLIC_SITE_KEYS.HOTEL)
  );

  if (siteKey === PUBLIC_SITE_KEYS.HOTEL) {
    if (hotelLikeLocations.length === 1) {
      return hotelLikeLocations[0];
    }
    if (locations.length === 1) {
      return locations[0];
    }
    return null;
  }

  const nonHotelLocations = locations.filter((location) => !hotelLikeLocations.includes(location));
  if (nonHotelLocations.length === 1) {
    return nonHotelLocations[0];
  }
  if (locations.length === 1) {
    return locations[0];
  }

  return null;
}

export async function resolveSiteOrderLocation(siteKey) {
  const normalizedSiteKey = normalizePublicSite(siteKey);
  const store = await Store.findOne({}, { locations: 1 }).lean();
  const locations = Array.isArray(store?.locations) ? store.locations : [];
  const activeLocations = locations.filter((location) => location?.isActive !== false);
  const matchedLocation = activeLocations.find((location) =>
    locationMatchesSite(location, normalizedSiteKey)
  );

  const fallbackLocation = matchedLocation || getFallbackLocation(activeLocations, normalizedSiteKey);

  if (fallbackLocation) {
    return {
      locationId: fallbackLocation._id || null,
      locationName: fallbackLocation.name || "",
    };
  }

  const site = getPublicSiteConfig(normalizedSiteKey);
  return {
    locationId: null,
    locationName: site?.shortLabel || site?.label || "",
  };
}