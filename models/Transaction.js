import mongoose from "mongoose";

const TransactionItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: String,
    price: Number,
    quantity: Number,
    salePriceIncTax: Number,
    qty: Number,
  },
  {
    _id: false,
    strict: false,
  }
);

const TenderPaymentSchema = new mongoose.Schema(
  {
    tenderId: { type: mongoose.Schema.Types.ObjectId, default: null },
    tenderType: { type: String, default: "" },
    tenderName: { type: String, default: "" },
    amount: { type: Number, default: 0 },
  },
  { _id: false }
);

const TransactionSchema = new mongoose.Schema({
  tenderType: { type: String, trim: true },
  tenderPayments: { type: [TenderPaymentSchema], default: [] },
  amountPaid: Number,
  total: Number,
  subtotal: Number,
  tax: Number,
  shippingCost: Number,
  deliveryFee: Number,
  deliveryFeeName: String,
  staff: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", default: null },
  staffName: String,
  location: String,
  locationId: { type: mongoose.Schema.Types.ObjectId, default: null },
  device: String,
  discount: Number,
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },
  customerName: String,
  salesChannel: { type: String, trim: true, default: "POS" },
  sourceOrderId: { type: String, trim: true, default: "" },
  sourceOrderType: { type: String, trim: true, default: "" },
  sourceSiteKey: { type: String, trim: true, default: "" },
  transactionType: { type: String, enum: ["pos"], default: "pos" },
  status: {
    type: String,
    enum: ["held", "completed", "refunded", "credit"],
    default: "completed",
  },
  subStatus: { type: String, enum: ["none", "edited", "void", null], default: null },
  change: Number,
  items: { type: [TransactionItemSchema], default: [] },
  inventoryUpdated: { type: Boolean, default: false },
  inventoryRestockedAt: Date,
  externalId: { type: String, trim: true },
  dedupeKey: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

TransactionSchema.index({ externalId: 1 }, { unique: true, sparse: true });
TransactionSchema.index({ dedupeKey: 1 }, { unique: true, sparse: true });
TransactionSchema.index({ salesChannel: 1, createdAt: -1 });
TransactionSchema.index({ sourceOrderId: 1 }, { sparse: true });
TransactionSchema.index({ location: 1, createdAt: -1 });
TransactionSchema.index({ locationId: 1, createdAt: -1 });

const Transaction =
  mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema);

export default Transaction;
export { Transaction };