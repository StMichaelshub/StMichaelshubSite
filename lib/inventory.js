export function getAvailableInventoryQuantity(product) {
  const quantity = Number.isFinite(product?.quantity) ? product.quantity : 0;
  const reservedQuantity = Number.isFinite(product?.reservedQuantity)
    ? product.reservedQuantity
    : 0;

  return Math.max(0, quantity - reservedQuantity);
}