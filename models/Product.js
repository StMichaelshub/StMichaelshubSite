import { model, Schema, models } from 'mongoose';

// Sub-schema for a single review
const ReviewSchema = new Schema({
  title: { type: String, required: true },
  text: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
   customerId: { type: Schema.Types.ObjectId, ref: 'User' }, // or 'Customer' depending on your model
  customerName: { type: String }, // optional for display
  createdAt: { type: Date, default: Date.now },
}, { _id: false }); // disable _id for subdocuments if not needed

const ProductSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  costPrice: { type: Number, required: true },
  taxRate: { type: Number, default: 0 },
  salePriceIncTax: { type: Number, required: true },
  margin: { type: Number, default: 0 },
  barcode: { type: String },
  productType: {
    type: String,
    enum: ["standard", "room"],
    default: "standard",
    index: true,
  },
  roomStatus: {
    type: String,
    enum: ["available", "reserved", "occupied"],
    default: "available",
    index: true,
  },
  quantity: { type: Number, default: 0 },
  reservedQuantity: { type: Number, default: 0 },
  isStockManaged: { type: Boolean, default: true },
  isArchived: { type: Boolean, default: false, index: true },
  minStock: { type: Number, default: 0 },
  maxStock: { type: Number, default: 0 },
  category: { type: String, default: "Top Level" },
  isChildProduct: { type: Boolean, default: false },
  parentProduct: { type: Schema.Types.ObjectId, ref: "Product" },
  childSalePrice: { type: Number },
  packType: { type: String, enum: ["unit", "pack"], default: "unit" },
  qtyPerPack: { type: Number, default: 1 },
  totalUnitsSold: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  lastSoldAt: Date,
  salesHistory: [
    {
      orderId: { type: Schema.Types.ObjectId, ref: "Order" },
      quantity: { type: Number, required: true },
      salePrice: { type: Number, required: true },
      soldAt: { type: Date, default: Date.now },
    },
  ],
  images: [
    {
      full: { type: String, required: true },
      thumb: { type: String, required: true },
    },
  ],
  properties: [{ type: Object }, []],
  locations: [{ type: String }],
  reviews: [ReviewSchema], // ✅ Add this
}, { timestamps: true });

export const Product = models.Product || model('Product', ProductSchema);
