import { PRODUCT_IMAGE_PLACEHOLDER } from "./productImages";

const defaultImages = [
  {
    full: PRODUCT_IMAGE_PLACEHOLDER,
    thumb: PRODUCT_IMAGE_PLACEHOLDER,
  },
];

function createSeededProduct({
  id,
  name,
  description,
  salePriceIncTax,
  costPrice,
  quantity,
  reservedQuantity,
  category,
  sku,
  createdAt,
  reviews = [],
  properties = [],
  locations = ["warehouse"],
}) {
  return {
    _id: id,
    name,
    description,
    costPrice,
    taxRate: 0,
    salePriceIncTax,
    margin: salePriceIncTax - costPrice,
    barcode: sku,
    sku,
    quantity,
    reservedQuantity,
    category,
    categoryName: category,
    images: defaultImages,
    properties,
    locations,
    reviews,
    createdAt,
    updatedAt: createdAt,
  };
}

const SEEDED_STOREFRONT_PRODUCTS = [
  createSeededProduct({
    id: "64f100000000000000000001",
    name: "Heritage Parboiled Rice 5kg",
    description: "A dependable 5kg bag of parboiled rice for family meals, weekly prep, and pantry stability.",
    salePriceIncTax: 21500,
    costPrice: 18200,
    quantity: 22,
    reservedQuantity: 4,
    category: "Pantry Staples",
    sku: "STM-PAN-001",
    createdAt: "2026-04-29T09:15:00.000Z",
    locations: ["warehouse"],
    properties: [{ label: "Pack size", value: "5kg" }],
    reviews: [
      {
        title: "Consistent quality",
        text: "Clean grains, easy to cook, and reliable for weekly family meals.",
        rating: 5,
        customerName: "Ada",
        createdAt: "2026-04-11T13:00:00.000Z",
      },
    ],
  }),
  createSeededProduct({
    id: "64f100000000000000000002",
    name: "Cold Pressed Olive Oil 1L",
    description: "Kitchen-grade olive oil for cooking, marinades, and premium everyday meal prep.",
    salePriceIncTax: 14500,
    costPrice: 11800,
    quantity: 14,
    reservedQuantity: 2,
    category: "Pantry Staples",
    sku: "STM-PAN-002",
    createdAt: "2026-04-28T16:30:00.000Z",
    locations: ["warehouse"],
    properties: [{ label: "Volume", value: "1L" }],
  }),
  createSeededProduct({
    id: "64f100000000000000000003",
    name: "Signature Tomato Pasta Sauce",
    description: "Rich tomato sauce with herbs and balanced acidity for quick dinners and batch cooking.",
    salePriceIncTax: 4200,
    costPrice: 3200,
    quantity: 28,
    reservedQuantity: 3,
    category: "Pantry Staples",
    sku: "STM-PAN-003",
    createdAt: "2026-04-27T15:45:00.000Z",
    locations: ["warehouse"],
  }),
  createSeededProduct({
    id: "64f100000000000000000004",
    name: "Deluxe Courtyard Room",
    description: "A calm guest room with a king bed, warm lighting, work desk, and courtyard-facing windows for short business or weekend stays.",
    salePriceIncTax: 68000,
    costPrice: 42000,
    quantity: 0,
    reservedQuantity: 0,
    category: "Rooms & Suites",
    sku: "STM-HTL-ROOM-001",
    createdAt: "2026-04-26T08:10:00.000Z",
    locations: ["hotel"],
    properties: [
      { label: "Occupancy", value: "2 guests" },
      { label: "Bed", value: "King bed" },
      { label: "View", value: "Courtyard view" },
      { label: "Breakfast", value: "Complimentary" },
    ],
    reviews: [
      {
        title: "Quiet and comfortable",
        text: "Clean room, soft bedding, and a much calmer night than I expected in the city.",
        rating: 4,
        customerName: "Ifeoma",
        createdAt: "2026-04-07T10:20:00.000Z",
      },
    ],
  }),
  createSeededProduct({
    id: "64f100000000000000000005",
    name: "Executive City Suite",
    description: "A spacious suite for longer stays, with a separate lounge corner, premium bathroom finishes, and added room service support.",
    salePriceIncTax: 92000,
    costPrice: 56000,
    quantity: 0,
    reservedQuantity: 0,
    category: "Rooms & Suites",
    sku: "STM-HTL-ROOM-002",
    createdAt: "2026-04-25T11:55:00.000Z",
    locations: ["hotel"],
    properties: [
      { label: "Occupancy", value: "2 adults + 1 child" },
      { label: "Bed", value: "King bed + lounge sofa" },
      { label: "Workspace", value: "Executive desk" },
      { label: "Perk", value: "Late check-out on request" },
    ],
  }),
  createSeededProduct({
    id: "64f100000000000000000006",
    name: "Family Lounge Suite",
    description: "A larger suite with flexible sleeping arrangements, family seating, and extra floor space for longer guest stays.",
    salePriceIncTax: 118000,
    costPrice: 69000,
    quantity: 0,
    reservedQuantity: 0,
    category: "Rooms & Suites",
    sku: "STM-HTL-ROOM-003",
    createdAt: "2026-04-24T07:25:00.000Z",
    locations: ["hotel"],
    properties: [
      { label: "Occupancy", value: "4 guests" },
      { label: "Bed", value: "2 queen beds" },
      { label: "Living area", value: "Separate family seating" },
      { label: "Breakfast", value: "Included for 4" },
    ],
  }),
  createSeededProduct({
    id: "64f100000000000000000007",
    name: "Premium Roma Tomatoes Pack",
    description: "Firm ripe tomatoes selected for stews, sauces, and fast everyday cooking.",
    salePriceIncTax: 3100,
    costPrice: 2100,
    quantity: 24,
    reservedQuantity: 4,
    category: "Fresh Produce",
    sku: "STM-FSH-001",
    createdAt: "2026-04-23T09:40:00.000Z",
    locations: ["warehouse"],
  }),
  createSeededProduct({
    id: "64f100000000000000000008",
    name: "Ready-to-Eat Bananas Bunch",
    description: "Selected ripe bananas for breakfast, smoothies, and fast grab-and-go snacks.",
    salePriceIncTax: 2400,
    costPrice: 1600,
    quantity: 30,
    reservedQuantity: 8,
    category: "Fresh Produce",
    sku: "STM-FSH-002",
    createdAt: "2026-04-22T14:05:00.000Z",
    locations: ["warehouse"],
  }),
  createSeededProduct({
    id: "64f100000000000000000009",
    name: "Creamy Hass Avocados Pack",
    description: "Avocados with a ready-to-ripen window for toast, salads, and healthy bowls.",
    salePriceIncTax: 4600,
    costPrice: 3300,
    quantity: 12,
    reservedQuantity: 2,
    category: "Fresh Produce",
    sku: "STM-FSH-003",
    createdAt: "2026-04-21T10:35:00.000Z",
    locations: ["warehouse"],
  }),
  createSeededProduct({
    id: "64f10000000000000000000a",
    name: "Rooftop Lounge Signature Platter",
    description: "A chef-selected platter designed for evening lounge service with grilled bites, fresh garnish, and table sharing.",
    salePriceIncTax: 18500,
    costPrice: 9400,
    quantity: 0,
    reservedQuantity: 0,
    category: "Lounge & Dining",
    sku: "STM-HTL-DINE-001",
    createdAt: "2026-04-20T13:50:00.000Z",
    locations: ["hotel"],
    properties: [
      { label: "Serving", value: "2 to 3 guests" },
      { label: "Service window", value: "4PM to 11PM" },
      { label: "Dining area", value: "Rooftop lounge" },
    ],
  }),
  createSeededProduct({
    id: "64f10000000000000000000b",
    name: "Sunrise Breakfast Tray",
    description: "An in-room breakfast tray with pastries, hot beverage service, fruit, and a guest-ready morning setup.",
    salePriceIncTax: 12500,
    costPrice: 6200,
    quantity: 0,
    reservedQuantity: 0,
    category: "Lounge & Dining",
    sku: "STM-HTL-DINE-002",
    createdAt: "2026-04-19T12:00:00.000Z",
    locations: ["hotel"],
    properties: [
      { label: "Serving", value: "1 guest" },
      { label: "Service window", value: "6AM to 11AM" },
      { label: "Style", value: "In-room breakfast" },
    ],
  }),
  createSeededProduct({
    id: "64f10000000000000000000c",
    name: "House Mocktail Flight",
    description: "A lounge mocktail tasting set with citrus, berry, and spice-forward signatures prepared for relaxed evening service.",
    salePriceIncTax: 9500,
    costPrice: 4300,
    quantity: 0,
    reservedQuantity: 0,
    category: "Lounge & Dining",
    sku: "STM-HTL-DINE-003",
    createdAt: "2026-04-18T08:45:00.000Z",
    locations: ["hotel"],
    properties: [
      { label: "Serving", value: "2 guests" },
      { label: "Service window", value: "All day lounge menu" },
      { label: "Style", value: "Signature non-alcoholic selection" },
    ],
  }),
];

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

export function getSeededStorefrontProducts() {
  return cloneValue(SEEDED_STOREFRONT_PRODUCTS);
}

export function getSeededStorefrontProductById(productId) {
  const product = SEEDED_STOREFRONT_PRODUCTS.find(
    (candidate) => String(candidate._id) === String(productId)
  );

  return product ? cloneValue(product) : null;
}

export function getSeededStorefrontProductsByIds(ids = []) {
  const seededProductsById = new Map(
    SEEDED_STOREFRONT_PRODUCTS.map((product) => [String(product._id), product])
  );

  return ids
    .map((id) => seededProductsById.get(String(id)))
    .filter(Boolean)
    .map((product) => cloneValue(product));
}