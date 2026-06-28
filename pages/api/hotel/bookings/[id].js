import { mongooseConnect } from "@/lib/mongoose";
import HotelBooking from "@/models/HotelBooking";
import {
  readHotelReservationAccessToken,
  verifyHotelReservationAccessToken,
} from "@/lib/hotelReservationAccess";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  await mongooseConnect();

  const { id } = req.query;
  const token = typeof req.query.token === "string" ? req.query.token : "";
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ message: "Booking id is required." });
  }

  const tokenPayload = readHotelReservationAccessToken(token);
  if (!tokenPayload || tokenPayload.kind !== "stay" || tokenPayload.reservationId !== id) {
    return res.status(403).json({ message: "A valid booking access token is required." });
  }

  try {
    const booking = await HotelBooking.findById(id);

    if (!booking) {
      return res.status(404).json({ message: "Booking request not found." });
    }

    if (
      !verifyHotelReservationAccessToken(token, {
        reservationId: booking._id,
        email: booking.email,
        kind: "stay",
        createdAt: booking.createdAt,
      })
    ) {
      return res.status(403).json({ message: "A valid booking access token is required." });
    }

    return res.status(200).json({
      _id: booking._id,
      reference: String(booking._id),
      roomName: booking.roomName,
      guestName: booking.guestName,
      email: booking.email,
      phone: booking.phone,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      nights: booking.nights,
      adults: booking.adults,
      children: booking.children,
      preferredArrivalTime: booking.preferredArrivalTime,
      specialRequests: booking.specialRequests,
      status: booking.status,
    });
  } catch (error) {
    console.error("Hotel booking fetch error:", error);
    return res.status(500).json({ message: "We could not load this booking request." });
  }
}