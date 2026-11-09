import mongoose from "mongoose";
import { Product } from "@/models/Product";

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeQuantity(value) {
  return Math.max(0, Math.floor(toNumber(value, 0)));
}

function normalizeProductId(value) {
  const productId = value?._id || value;
  const candidate = String(productId || "").trim();
  return mongoose.Types.ObjectId.isValid(candidate) ? candidate : "";
}

// Browser pages must import this from "@/lib/stockMath" (this file loads models).
export { getAvailableInventoryQuantity } from "@/lib/stockMath";

export function resolveOrderItemProductId(item) {
  return normalizeProductId(item?.productId || item?._id || item?.id);
}

export function normalizeTransactionItems(items = []) {
  return (Array.isArray(items) ? items : [])
    .map((item) => {
      const productId = resolveOrderItemProductId(item);
      const qty = normalizeQuantity(item?.qty ?? item?.quantity);
      const salePriceIncTax = toNumber(item?.salePriceIncTax ?? item?.price, 0);

      return {
        productId,
        name: item?.name || "Unnamed item",
        price: salePriceIncTax,
        quantity: qty,
        salePriceIncTax,
        qty,
        category: item?.category || "",
        description: item?.description || "",
        images: Array.isArray(item?.images) ? item.images : [],
      };
    })
    .filter((item) => item.productId && item.qty > 0);
}

async function releaseReservedQuantities(items = []) {
  for (const item of normalizeTransactionItems(items)) {
    await Product.updateOne(
      { _id: item.productId },
      [
        {
          $set: {
            reservedQuantity: {
              $max: [
                0,
                {
                  $subtract: [
                    { $ifNull: ["$reservedQuantity", 0] },
                    item.qty,
                  ],
                },
              ],
            },
          },
        },
      ]
    );
  }
}

async function decrementDirectInventory(item) {
  await Product.updateOne(
    { _id: item.productId },
    [
      {
        $set: {
          quantity: {
            $subtract: [{ $ifNull: ["$quantity", 0] }, item.qty],
          },
          reservedQuantity: {
            $max: [
              0,
              {
                $subtract: [
                  { $ifNull: ["$reservedQuantity", 0] },
                  item.qty,
                ],
              },
            ],
          },
        },
      },
    ]
  );
}

async function deriveChildQuantities(parentId) {
  const parent = await Product.findById(parentId)
    .select("quantity qtyPerPack")
    .lean();

  if (!parent || !toNumber(parent.qtyPerPack, 0)) {
    return;
  }

  await Product.updateMany(
    {
      parentProduct: parentId,
      isChildProduct: true,
      packType: { $ne: "pack" },
    },
    {
      $set: {
        quantity: toNumber(parent.quantity, 0) * toNumber(parent.qtyPerPack, 1),
      },
    }
  );
}

async function appendSalesMetrics(items = [], orderId) {
  const soldAt = new Date();

  for (const item of normalizeTransactionItems(items)) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: {
        totalUnitsSold: item.qty,
        totalRevenue: item.qty * item.salePriceIncTax,
      },
      $set: { lastSoldAt: soldAt },
      $push: {
        salesHistory: {
          orderId,
          quantity: item.qty,
          salePrice: item.salePriceIncTax,
          soldAt,
        },
      },
    });
  }
}

export async function finalizeInventoryForSale(items = [], { orderId } = {}) {
  const normalizedItems = normalizeTransactionItems(items);
  if (!normalizedItems.length) {
    return { finalizedItems: [] };
  }

  const productIds = normalizedItems.map((item) => item.productId);
  const products = await Product.find({ _id: { $in: productIds } })
    .select("_id isChildProduct parentProduct packType qtyPerPack")
    .lean();
  const productsById = new Map(products.map((product) => [String(product._id), product]));
  const directItems = [];
  const childReservations = [];
  const childUnitsByParent = new Map();

  for (const item of normalizedItems) {
    const product = productsById.get(String(item.productId));
    const parentProductId = normalizeProductId(product?.parentProduct);
    const isChildUnit =
      product?.isChildProduct && parentProductId && product?.packType !== "pack";

    if (!isChildUnit) {
      directItems.push(item);
      continue;
    }

    childReservations.push(item);
    childUnitsByParent.set(
      parentProductId,
      (childUnitsByParent.get(parentProductId) || 0) + item.qty
    );
  }

  for (const item of directItems) {
    await decrementDirectInventory(item);
  }

  if (childReservations.length) {
    await releaseReservedQuantities(childReservations);
  }

  for (const [parentProductId, soldUnits] of childUnitsByParent.entries()) {
    const parent = await Product.findById(parentProductId)
      .select("qtyPerPack")
      .lean();
    const qtyPerPack = Math.max(1, toNumber(parent?.qtyPerPack, 1));

    await Product.findByIdAndUpdate(parentProductId, {
      $inc: { quantity: -(soldUnits / qtyPerPack) },
    });
    await deriveChildQuantities(parentProductId);
  }

  if (orderId) {
    await appendSalesMetrics(normalizedItems, orderId);
  }

  return { finalizedItems: normalizedItems };
}