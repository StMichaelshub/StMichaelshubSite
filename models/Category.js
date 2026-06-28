import mongoose, { model, models, Schema } from "mongoose";

const CategorySchema = new Schema({
  name: { type: String, required: true },
  parent: { type: mongoose.Types.ObjectId, ref: "Category" },
  properties: [{ type: Object }],
  icon: { type: String, default: "" },
  isStockManaged: { type: Boolean, default: true },
  locations: [{ type: String }],
  images: [
    {
      full: { type: String },
      thumb: { type: String },
    },
  ],
});

export default models.Category || model("Category", CategorySchema);
export const Category = models.Category || model("Category", CategorySchema);
