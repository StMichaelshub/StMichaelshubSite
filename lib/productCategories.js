import mongoose from "mongoose";
import { Category } from "@/models/Category";

function toPlainProduct(product) {
  if (!product) return null;
  return typeof product.toObject === "function" ? product.toObject() : { ...product };
}

function normalizeCategoryValue(category) {
  return typeof category === "string" ? category.trim() : "";
}

function resolveDisplayCategory(categoryValue, categoriesById, categoriesByName) {
  if (!categoryValue) {
    return "Uncategorized";
  }

  const resolvedName = categoriesById.get(categoryValue) || categoriesByName.get(categoryValue);
  if (resolvedName) {
    return resolvedName;
  }

  return mongoose.Types.ObjectId.isValid(categoryValue) ? "Uncategorized" : categoryValue;
}

export async function attachCategoryNames(products) {
  const productList = (Array.isArray(products) ? products : [products])
    .map(toPlainProduct)
    .filter(Boolean);

  if (!productList.length) {
    return Array.isArray(products) ? [] : null;
  }

  const categoryValues = [...new Set(productList.map((product) => normalizeCategoryValue(product.category)).filter(Boolean))];
  const objectIdValues = categoryValues.filter((value) => mongoose.Types.ObjectId.isValid(value));
  const nameValues = categoryValues.filter((value) => !mongoose.Types.ObjectId.isValid(value));
  const lookupFilter = [];

  if (objectIdValues.length) {
    lookupFilter.push({ _id: { $in: objectIdValues } });
  }
  if (nameValues.length) {
    lookupFilter.push({ name: { $in: nameValues } });
  }

  const categories = lookupFilter.length
    ? await Category.find({ $or: lookupFilter }).select("_id name").lean()
    : [];

  const categoriesById = new Map(categories.map((category) => [String(category._id), category.name]));
  const categoriesByName = new Map(categories.map((category) => [category.name, category.name]));

  const hydratedProducts = productList.map((product) => {
    const categoryValue = normalizeCategoryValue(product.category);
    return {
      ...product,
      categoryName: resolveDisplayCategory(categoryValue, categoriesById, categoriesByName),
    };
  });

  return Array.isArray(products) ? hydratedProducts : hydratedProducts[0];
}
