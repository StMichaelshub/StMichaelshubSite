import mongoose from 'mongoose';

export const CUSTOMER_TYPES = [
  "REGULAR",
  "VIP",
  "NEW",
  "INACTIVE",
  "BULK_BUYER",
  "ONLINE",
];

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      sparse: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    type: {
      type: String,
      enum: CUSTOMER_TYPES,
      default: "ONLINE",
    },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema);

export default Customer;
