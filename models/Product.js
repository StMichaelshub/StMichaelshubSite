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
  quantity: { type: Number, default: 0 },
  reservedQuantity: { type: Number, default: 0 },
  category: { type: String, default: "Top Level" },
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
