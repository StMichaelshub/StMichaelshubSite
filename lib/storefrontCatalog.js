import { Product } from "@/models/Product";
import { attachCategoryNames } from "@/lib/productCategories";
import { mongooseConnect } from "@/lib/mongoose";
import { filterProductsForPublicSite } from "@/lib/publicSite";
import {
  getSeededStorefrontProductById,
  getSeededStorefrontProducts,
  getSeededStorefrontProductsByIds,
} from "./seededStorefront";

const CATALOG_CACHE_TTL_MS = 20_000;

const globalStorefrontState = globalThis;
const cachedCatalogState = globalStorefrontState.__stMichaelsCatalogState ?? {
  products: null,
  expiresAt: 0,
  pending: null,
};

if (!globalStorefrontState.__stMichaelsCatalogState) {
  globalStorefrontState.__stMichaelsCatalogState = cachedCatalogState;
}

function sortProductsByNewest(products) {
  return [...products].sort(
    (leftProduct, rightProduct) =>
      new Date(rightProduct.createdAt || 0) - new Date(leftProduct.createdAt || 0)
  );
}

function applyLimit(products, limit) {
  if (!Number.isFinite(limit) || limit <= 0) {
    return products;
  }

  return products.slice(0, limit);
}

async function getDatabaseBackedProducts(limit) {
  if (cachedCatalogState.products && cachedCatalogState.expiresAt > Date.now()) {
    return applyLimit(cachedCatalogState.products, limit);
  }

  if (!cachedCatalogState.pending) {
    cachedCatalogState.pending = Product.find({}, null, { sort: { _id: -1 } })
      .lean()
      .then((products) => (products.length ? attachCategoryNames(products) : []))
      .then((products) => {
        cachedCatalogState.products = products;
        cachedCatalogState.expiresAt = Date.now() + CATALOG_CACHE_TTL_MS;
        return products;
      })
      .finally(() => {
        cachedCatalogState.pending = null;
      });
  }

  const products = await cachedCatalogState.pending;
  return applyLimit(products, limit);
}

export async function getStorefrontProducts(options = {}) {
  const { limit, site } = options;
  const connection = await mongooseConnect({ allowFailure: true });

  if (connection) {
    const databaseProducts = filterProductsForPublicSite(
      await getDatabaseBackedProducts(),
      site
    );
    return applyLimit(databaseProducts, limit);
  }

  return applyLimit(
    filterProductsForPublicSite(sortProductsByNewest(getSeededStorefrontProducts()), site),
    limit
  );
}

export async function getStorefrontProductById(productId, options = {}) {
  const { fallbackToLatest = false, site } = options;
  const connection = await mongooseConnect({ allowFailure: true });

  if (connection) {
    const products = filterProductsForPublicSite(await getDatabaseBackedProducts(), site);

    if (productId) {
      const product = products.find((candidate) => String(candidate._id) === String(productId));
      if (product) {
        return product;
      }
    }

    if (fallbackToLatest) {
      return products[0] || null;
    }

    return null;
  }

  if (productId) {
    const seededProduct = getSeededStorefrontProductById(productId);
    if (seededProduct) {
      return filterProductsForPublicSite([seededProduct], site)[0] || null;
    }
  }

  if (fallbackToLatest) {
    return filterProductsForPublicSite(getSeededStorefrontProducts(), site)[0] || null;
  }

  return null;
}

export async function getStorefrontProductsByIds(ids = [], options = {}) {
  const normalizedIds = Array.isArray(ids) ? ids : [];
  const { site } = options;
  const connection = await mongooseConnect({ allowFailure: true });

  if (connection) {
    const products = filterProductsForPublicSite(await getDatabaseBackedProducts(), site);
    const productsById = new Map(products.map((product) => [String(product._id), product]));
    const matchedProducts = normalizedIds
      .map((id) => productsById.get(String(id)))
      .filter(Boolean);

    return matchedProducts;
  }

  return filterProductsForPublicSite(getSeededStorefrontProductsByIds(normalizedIds), site);
}