function normalizeToken(value) {
  return typeof value === "string"
    ? value.trim().toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ")
    : "";
}

const ROOM_TOKENS = [
  "room",
  "suite",
  "deluxe",
  "executive",
  "presidential",
  "family stay",
  "accommodation",
  "king bed",
  "queen bed",
  "stay package",
];

const DINING_TOKENS = [
  "lounge",
  "dining",
  "breakfast",
  "lunch",
  "dinner",
  "cocktail",
  "mocktail",
  "menu",
  "platter",
  "grill",
  "drink",
  "food",
  "chef",
];

function flattenProductProperties(product) {
  return Array.isArray(product?.properties) ? product.properties : [];
}

function getProductText(product) {
  return normalizeToken(
    [
      product?.name,
      product?.description,
      product?.categoryName,
      product?.category,
      ...flattenProductProperties(product).flatMap((property) => [property?.label, property?.value]),
    ]
      .filter(Boolean)
      .join(" ")
  );
}

export function getHotelProductKind(product) {
  const nameAndCategory = normalizeToken(
    [product?.name, product?.categoryName, product?.category].filter(Boolean).join(" ")
  );
  const haystack = getProductText(product);
  const roomLeadMatch = ROOM_TOKENS.some((token) => nameAndCategory.includes(token));
  const diningLeadMatch = DINING_TOKENS.some((token) => nameAndCategory.includes(token));
  const roomMatch = ROOM_TOKENS.some((token) => haystack.includes(token));
  const diningMatch = DINING_TOKENS.some((token) => haystack.includes(token));

  if (diningLeadMatch && !roomLeadMatch) {
    return "dining";
  }

  if (roomLeadMatch) {
    return "room";
  }

  if (diningMatch && !roomMatch) {
    return "dining";
  }

  if (roomMatch) {
    return "room";
  }

  if (diningMatch) {
    return "dining";
  }

  return (product?.salePriceIncTax || 0) >= 25000 ? "room" : "dining";
}

export function isHotelRoomProduct(product) {
  return getHotelProductKind(product) === "room";
}

export function isHotelDiningProduct(product) {
  return getHotelProductKind(product) === "dining";
}

export function getHotelPropertyValue(product, labels = []) {
  const normalizedLabels = labels.map((label) => normalizeToken(label));

  for (const property of flattenProductProperties(product)) {
    const label = normalizeToken(property?.label);
    if (normalizedLabels.includes(label)) {
      return property?.value || "";
    }
  }

  return "";
}

export function getHotelRoomAmenities(product) {
  const prioritizedAmenities = flattenProductProperties(product)
    .filter((property) => property?.value)
    .map((property) => `${property.label}: ${property.value}`)
    .slice(0, 4);

  if (prioritizedAmenities.length) {
    return prioritizedAmenities;
  }

  return ["Complimentary Wi-Fi", "Private bathroom", "Daily housekeeping"];
}

export function getHotelRoomOccupancy(product) {
  return (
    getHotelPropertyValue(product, ["Occupancy", "Guests", "Sleeps"]) ||
    "2 guests"
  );
}

export function getHotelRoomBedLabel(product) {
  return (
    getHotelPropertyValue(product, ["Bed", "Bedding", "Bed type"]) ||
    "Premium bedding"
  );
}

export function getHotelRoomRateLabel(product) {
  const rate = Number(product?.salePriceIncTax || 0);
  return `From ₦${rate.toLocaleString()} / night`;
}

export function getHotelDiningPriceLabel(product) {
  const price = Number(product?.salePriceIncTax || 0);
  return `From ₦${price.toLocaleString()}`;
}

export function getHotelCatalogSections(products = []) {
  const rooms = [];
  const dining = [];

  for (const product of products) {
    if (isHotelRoomProduct(product)) {
      rooms.push(product);
      continue;
    }

    dining.push(product);
  }

  rooms.sort((leftRoom, rightRoom) => (leftRoom.salePriceIncTax || 0) - (rightRoom.salePriceIncTax || 0));
  dining.sort((leftItem, rightItem) => (leftItem.salePriceIncTax || 0) - (rightItem.salePriceIncTax || 0));

  return {
    rooms,
    dining,
    featuredRoom: rooms[0] || null,
    featuredDining: dining[0] || null,
    roomCount: rooms.length,
    diningCount: dining.length,
    startingRate: rooms[0]?.salePriceIncTax || 0,
  };
}