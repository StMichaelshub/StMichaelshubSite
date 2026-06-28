import { getHotelCatalogSections, isHotelRoomProduct } from "@/lib/hotelCatalog";
import { PUBLIC_SITE_KEYS, filterProductsForPublicSite } from "@/lib/publicSite";
import { getSeededStorefrontProducts } from "@/lib/seededStorefront";

function getSeededHotelProducts() {
  return filterProductsForPublicSite(getSeededStorefrontProducts(), PUBLIC_SITE_KEYS.HOTEL);
}

export function resolveHotelCatalogProducts(products = []) {
  const liveProducts = Array.isArray(products) ? products : [];
  if (liveProducts.length > 0) {
    return liveProducts;
  }

  return getSeededHotelProducts();
}

export function resolveHotelCatalogSections(products = []) {
  const liveSections = getHotelCatalogSections(Array.isArray(products) ? products : []);
  const seededSections = getHotelCatalogSections(getSeededHotelProducts());
  const rooms = liveSections.rooms.length > 0 ? liveSections.rooms : seededSections.rooms;
  const dining = liveSections.dining.length > 0 ? liveSections.dining : seededSections.dining;

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

export function resolveHotelRoomById(productId, products = []) {
  const room = resolveHotelCatalogSections(products).rooms.find(
    (candidate) => String(candidate._id) === String(productId)
  );

  return room && isHotelRoomProduct(room) ? room : null;
}