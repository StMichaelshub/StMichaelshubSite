import mongoose from "mongoose";

const customerOtpSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: ["LOGIN"],
      default: "LOGIN",
    },
    codeHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    consumedAt: Date,
  },
  { timestamps: true }
);

customerOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const CustomerOtp =
  mongoose.models.CustomerOtp || mongoose.model("CustomerOtp", customerOtpSchema);

export default CustomerOtp;