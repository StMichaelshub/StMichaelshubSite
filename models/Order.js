import mongoose from "mongoose";
import { PUBLIC_SITE_KEYS } from "@/lib/publicSite";

const CustomerSnapshotSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    phone: String,
    address: String,
    city: String,
    type: String,
  },
  { _id: false }
);

const ShippingDetailsSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    phone: String,
    address: String,
    city: String,
  },
  { _id: false }
);

const OrderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    name: String,
    category: String,
    description: String,
    images: [String],
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    siteKey: {
      type: String,
      enum: [PUBLIC_SITE_KEYS.STORE, PUBLIC_SITE_KEYS.HOTEL],
      default: PUBLIC_SITE_KEYS.STORE,
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    locationName: {
      type: String,
      default: "",
      index: true,
    },
    customerSnapshot: CustomerSnapshotSchema,
    shippingDetails: ShippingDetailsSchema,
    items: [OrderItemSchema],
    cartProducts: [OrderItemSchema],

    subtotal: Number,
    shippingCost: Number,
    total: Number,
    status: { type: String, default: "Pending Payment" },
    paid: { type: Boolean, default: false },
    paymentReference: { type: String },
    paymentStatus: { type: String, default: "Pending" },
    paymentChannel: { type: String, default: "manual-entry" },
    reservationStatus: {
      type: String,
      enum: ["active", "releasing", "released", "finalizing", "finalized"],
      default: "active",
    },
    reservationExpiresAt: Date,
    inventoryFinalizedBy: { type: String, enum: ["paystack", "admin", "pos", null], default: null },
    reservationReleasedAt: Date,
    finalizedAt: Date,
    cancellationReason: String,
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
