import mongoose from "mongoose";
import { PUBLIC_SITE_KEYS } from "@/lib/publicSite";

const HotelBookingSchema = new mongoose.Schema(
  {
    siteKey: {
      type: String,
      enum: [PUBLIC_SITE_KEYS.HOTEL],
      default: PUBLIC_SITE_KEYS.HOTEL,
    },
    roomProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    roomName: {
      type: String,
      trim: true,
      default: "",
    },
    guestName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    checkInDate: {
      type: Date,
      required: true,
    },
    checkOutDate: {
      type: Date,
      required: true,
    },
    nights: {
      type: Number,
      required: true,
      min: 1,
    },
    adults: {
      type: Number,
      default: 1,
      min: 1,
    },
    children: {
      type: Number,
      default: 0,
      min: 0,
    },
    preferredArrivalTime: {
      type: String,
      trim: true,
      default: "",
    },
    specialRequests: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["requested", "confirmed", "cancelled", "completed"],
      default: "requested",
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.models.HotelBooking || mongoose.model("HotelBooking", HotelBookingSchema);