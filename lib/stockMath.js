/**
 * Stock maths that browser pages need. Kept free of database imports:
 * lib/inventory.js loads mongoose models, and importing it from a page
 * crashes the site in the browser.
 */
export function getAvailableInventoryQuantity(product) {
  const quantity = Number.isFinite(product?.quantity) ? product.quantity : 0;
  const reservedQuantity = Number.isFinite(product?.reservedQuantity)
    ? product.reservedQuantity
    : 0;

  return Math.max(0, quantity - reservedQuantity);
}
