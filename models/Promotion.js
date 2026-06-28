import mongoose from "mongoose";

const PromotionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  targetCustomerTypes: [{
    type: String,
    enum: ["REGULAR", "VIP", "NEW", "INACTIVE", "BULK_BUYER", "ONLINE"],
  }],
  valueType: {
    type: String,
    enum: ["DISCOUNT", "INCREMENT"],
    default: "DISCOUNT",
  },
  discountType: {
    type: String,
    enum: ["PERCENTAGE", "FIXED"],
    default: "PERCENTAGE",
  },
  discountValue: {
    type: Number,
    required: true,
  },
  fixedAmountApplyMode: {
    type: String,
    enum: ["PER_ITEM", "TOTAL"],
    default: "PER_ITEM",
  },
  applicationType: {
    type: String,
    enum: ["ONE_PRODUCT", "ALL_PRODUCTS", "CATEGORY"],
    required: true,
  },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  indefinite: {
    type: Boolean,
    default: false,
  },
  active: {
    type: Boolean,
    default: true,
  },
  displayAbovePrice: {
    type: Boolean,
    default: true,
  },
  priority: {
    type: Number,
    default: 0,
  },
  timesUsed: {
    type: Number,
    default: 0,
  },
  maxUses: Number,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

PromotionSchema.pre("save", function promotionPreSave(next) {
  if (this.indefinite) {
    if (!this.startDate) {
      this.startDate = new Date();
    }

    const oneYearLater = new Date(this.startDate);
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
    this.endDate = oneYearLater;
  }

  next();
});

PromotionSchema.index({ active: 1, startDate: 1, endDate: 1 });
PromotionSchema.index({ targetCustomerTypes: 1 });
PromotionSchema.index({ products: 1 });
PromotionSchema.index({ categories: 1 });

const Promotion = mongoose.models.Promotion || mongoose.model("Promotion", PromotionSchema);

export default Promotion;