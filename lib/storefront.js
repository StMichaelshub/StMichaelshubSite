import { getAvailableInventoryQuantity } from "./inventory";

export function getCategoryBreakdown(products = []) {
  const categoryMap = new Map();

  for (const product of products) {
    const categoryName = product?.categoryName || product?.category || "Uncategorized";
    const currentEntry = categoryMap.get(categoryName) || {
      name: categoryName,
      count: 0,
      availableCount: 0,
    };

    currentEntry.count += 1;
    if (getAvailableInventoryQuantity(product) > 0) {
      currentEntry.availableCount += 1;
    }

    categoryMap.set(categoryName, currentEntry);
  }

  return Array.from(categoryMap.values()).sort((leftCategory, rightCategory) => {
    if (rightCategory.count !== leftCategory.count) {
      return rightCategory.count - leftCategory.count;
    }

    return leftCategory.name.localeCompare(rightCategory.name);
  });
}

export function getCatalogInsights(products = []) {
  const categoryBreakdown = getCategoryBreakdown(products);
  const prices = products
    .map((product) => product?.salePriceIncTax)
    .filter((price) => Number.isFinite(price));

  return {
    productCount: products.length,
    availableCount: products.filter((product) => getAvailableInventoryQuantity(product) > 0).length,
    categoryCount: categoryBreakdown.length,
    minPrice: prices.length ? Math.min(...prices) : 0,
    maxPrice: prices.length ? Math.max(...prices) : 0,
    topCategories: categoryBreakdown.slice(0, 4),
  };
}