export const PRODUCT_IMAGE_PLACEHOLDER = "/images/product-placeholder.svg";

function sanitizeUrl(url) {
  return typeof url === "string" && url.trim() ? url.trim() : "";
}

export function toProductImageObject(image) {
  if (!image || typeof image !== "object") {
    return null;
  }

  const full = sanitizeUrl(image.full);
  const thumb = sanitizeUrl(image.thumb);

  if (!full || !thumb) {
    return null;
  }

  return { full, thumb };
}

export function normalizeProductImages(images) {
  if (!Array.isArray(images)) {
    return [];
  }

  return images.map(toProductImageObject).filter(Boolean);
}

export function getPrimaryProductImage(images, options = {}) {
  const { preferThumb = false, fallback = PRODUCT_IMAGE_PLACEHOLDER } = options;
  const normalized = normalizeProductImages(images);

  if (!normalized.length) {
    return fallback;
  }

  return preferThumb ? normalized[0].thumb : normalized[0].full;
}