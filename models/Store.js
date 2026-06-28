import mongoose from "mongoose";

const LocationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    code: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const StoreSchema = new mongoose.Schema(
  {
    storeName: { type: String, default: "" },
    companyName: { type: String, default: "" },
    companyDisplayName: { type: String, default: "" },
    email: { type: String, default: "" },
    website: { type: String, default: "" },
    logo: { type: String, default: "" },
    locations: [LocationSchema],
    shippingBaseCost: { type: Number, default: 2000 },
    shippingRatePerKm: { type: Number, default: 100 },
    shippingFallbackCost: { type: Number, default: 2000 },
  },
  { timestamps: true }
);

export default mongoose.models.Store || mongoose.model("Store", StoreSchema);