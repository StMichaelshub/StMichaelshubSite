import { mongooseConnect } from "@/lib/mongoose";
import mongoose from "mongoose";
import { Product } from "@/models/Product";
import HotelBooking from "@/models/HotelBooking";
import { PUBLIC_SITE_KEYS, productMatchesPublicSite } from "@/lib/publicSite";
import { createMailTransport, getMailFromAddress } from "@/lib/mail";
import {
  buildHotelManageBookingsUrl,
  buildHotelReservationConfirmationUrl,
  createHotelReservationAccessToken,
} from "@/lib/hotelReservationAccess";
import { createHotelEmailHtml, HOTEL_BRAND_NAME } from "@/lib/hotelEmailTemplates";
import { STORE_DETAILS } from "@/lib/storeDetails";

const MS_PER_NIGHT = 24 * 60 * 60 * 1000;

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeInteger(value, fallbackValue) {
  const parsedValue = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsedValue) ? parsedValue : fallbackValue;
}

function toUtcMidnight(value) {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return new Date(Date.UTC(parsedDate.getUTCFullYear(), parsedDate.getUTCMonth(), parsedDate.getUTCDate()));
}

function calculateNightCount(checkInDate, checkOutDate) {
  if (!checkInDate || !checkOutDate) {
    return 0;
  }

  return Math.round((checkOutDate.getTime() - checkInDate.getTime()) / MS_PER_NIGHT);
}

function validatePayload(payload) {
  const guestName = normalizeString(payload.guestName);
  const email = normalizeString(payload.email).toLowerCase();
  const phone = normalizeString(payload.phone);
  const roomId = normalizeString(payload.roomId);
  const roomName = normalizeString(payload.roomName);
  const preferredArrivalTime = normalizeString(payload.preferredArrivalTime);
  const specialRequests = normalizeString(payload.specialRequests);
  const adults = Math.max(1, normalizeInteger(payload.adults, 1));
  const children = Math.max(0, normalizeInteger(payload.children, 0));
  const checkInDate = toUtcMidnight(payload.checkInDate);
  const checkOutDate = toUtcMidnight(payload.checkOutDate);
  const nights = calculateNightCount(checkInDate, checkOutDate);
  const today = toUtcMidnight(new Date());

  if (!guestName) {
    return { error: "Guest name is required." };
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "A valid email address is required." };
  }

  if (!phone || phone.replace(/\D/g, "").length < 10) {
    return { error: "A valid phone number is required." };
  }

  if (!checkInDate || !checkOutDate) {
    return { error: "Check-in and check-out dates are required." };
  }

  if (checkInDate < today) {
    return { error: "Check-in date cannot be in the past." };
  }

  if (nights < 1) {
    return { error: "Check-out date must be after check-in date." };
  }

  return {
    value: {
      guestName,
      email,
      phone,
      roomId,
      roomName,
      preferredArrivalTime,
      specialRequests,
      adults,
      children,
      checkInDate,
      checkOutDate,
      nights,
    },
  };
}

async function sendBookingEmails({ booking, accessToken, req }) {
  try {
    const transporter = createMailTransport();
    if (!transporter) {
      return;
    }

    const hotelMailLabel = HOTEL_BRAND_NAME;
    const stayWindow = `${booking.checkInDate.toISOString().slice(0, 10)} to ${booking.checkOutDate.toISOString().slice(0, 10)}`;
    const roomLabel = booking.roomName || "General stay request";
    const confirmationUrl = buildHotelReservationConfirmationUrl({
      req,
      reservationId: booking._id,
      kind: "stay",
      token: accessToken,
    });
    const manageUrl = buildHotelManageBookingsUrl(req);
    const requestSummary = [
      `Booking ID: ${booking._id}`,
      `Guest: ${booking.guestName}`,
      `Room: ${roomLabel}`,
      `Stay: ${stayWindow} (${booking.nights} night${booking.nights === 1 ? "" : "s"})`,
      `Guests: ${booking.adults} adult${booking.adults === 1 ? "" : "s"}${booking.children ? `, ${booking.children} child${booking.children === 1 ? "" : "ren"}` : ""}`,
      `Phone: ${booking.phone}`,
      booking.preferredArrivalTime ? `Arrival: ${booking.preferredArrivalTime}` : null,
      booking.specialRequests ? `Notes: ${booking.specialRequests}` : null,
      confirmationUrl ? `Confirmation link: ${confirmationUrl}` : null,
      manageUrl ? `Manage booking: ${manageUrl}` : null,
    ]
      .filter(Boolean)
      .join("\n");
    const guestSummary = [
      `Reference ID: ${booking._id}`,
      `Requested room: ${roomLabel}`,
      `Stay dates: ${stayWindow}`,
      `Guests: ${booking.adults} adult${booking.adults === 1 ? "" : "s"}${booking.children ? `, ${booking.children} child${booking.children === 1 ? "" : "ren"}` : ""}`,
      booking.preferredArrivalTime ? `Preferred arrival: ${booking.preferredArrivalTime}` : null,
      confirmationUrl ? `View confirmation: ${confirmationUrl}` : null,
      manageUrl ? `Manage booking: ${manageUrl}` : null,
    ]
      .filter(Boolean)
      .join("\n");
    const commonRows = [
      { label: "Reference ID", value: String(booking._id) },
      { label: "Requested room", value: roomLabel },
      { label: "Stay dates", value: stayWindow },
      {
        label: "Guests",
        value: `${booking.adults} adult${booking.adults === 1 ? "" : "s"}${booking.children ? `, ${booking.children} child${booking.children === 1 ? "" : "ren"}` : ""}`,
      },
      booking.phone ? { label: "Phone", value: booking.phone } : null,
      booking.preferredArrivalTime ? { label: "Preferred arrival", value: booking.preferredArrivalTime } : null,
      booking.specialRequests ? { label: "Notes", value: booking.specialRequests } : null,
    ].filter(Boolean);

    await Promise.all([
      transporter.sendMail({
        from: getMailFromAddress(hotelMailLabel),
        to: STORE_DETAILS.email,
        subject: `New reservation request for ${hotelMailLabel}: ${roomLabel}`,
        text: `A new reservation request has been submitted for ${hotelMailLabel}.\n\n${requestSummary}`,
        html: createHotelEmailHtml({
          eyebrow: "New hotel reservation request",
          title: `New request for ${roomLabel}`,
          intro: `A new room request has been submitted for ${hotelMailLabel}. Review the guest details below and continue from the reservation tools.`,
          rows: commonRows,
          primaryAction: confirmationUrl ? { label: "Open confirmation", href: confirmationUrl } : null,
          secondaryAction: manageUrl ? { label: "Manage bookings", href: manageUrl } : null,
          closing: "Use the reservation tools to review the request and coordinate any follow-up with the guest.",
        }),
      }),
      transporter.sendMail({
        from: getMailFromAddress(hotelMailLabel),
        to: booking.email,
        subject: `${hotelMailLabel} booking request received`,
        text: `Hi ${booking.guestName},\n\nThank you for choosing ${hotelMailLabel}. We have received your booking request for ${roomLabel}.\n\n${guestSummary}\n\nOur reservations desk will contact you shortly to confirm availability and finalize your stay.`,
        html: createHotelEmailHtml({
          eyebrow: "Booking request received",
          title: "Your stay request is in review",
          greeting: `Hi ${booking.guestName},`,
          intro: `Thank you for choosing ${hotelMailLabel}. We have received your booking request for ${roomLabel} and will review availability shortly.`,
          rows: commonRows,
          primaryAction: confirmationUrl ? { label: "View confirmation", href: confirmationUrl } : null,
          secondaryAction: manageUrl ? { label: "Manage booking", href: manageUrl } : null,
          closing: "Our reservations desk will contact you shortly to confirm availability and finalize your stay.",
        }),
      }),
    ]);
  } catch (error) {
    console.error("Hotel booking email send failed (non-critical):", error.message);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  await mongooseConnect();

  const validation = validatePayload(req.body || {});
  if (validation.error) {
    return res.status(400).json({ message: validation.error });
  }

  const payload = validation.value;

  try {
    let roomProduct = null;

    if (payload.roomId && mongoose.isValidObjectId(payload.roomId)) {
      roomProduct = await Product.findById(payload.roomId);

      if (roomProduct && !productMatchesPublicSite(roomProduct, PUBLIC_SITE_KEYS.HOTEL)) {
        return res.status(404).json({ message: "The selected room could not be found." });
      }
    }

    const booking = await HotelBooking.create({
      roomProduct: roomProduct?._id,
      roomName: payload.roomName || roomProduct?.name || "",
      guestName: payload.guestName,
      email: payload.email,
      phone: payload.phone,
      checkInDate: payload.checkInDate,
      checkOutDate: payload.checkOutDate,
      nights: payload.nights,
      adults: payload.adults,
      children: payload.children,
      preferredArrivalTime: payload.preferredArrivalTime,
      specialRequests: payload.specialRequests,
    });

    const accessToken = createHotelReservationAccessToken({
      reservationId: booking._id,
      email: booking.email,
      kind: "stay",
      createdAt: booking.createdAt,
    });

    await sendBookingEmails({ booking, accessToken, req });

    return res.status(201).json({
      success: true,
      bookingId: booking._id,
      accessToken,
      booking: {
        _id: booking._id,
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
      },
    });
  } catch (error) {
    console.error("Hotel booking request error:", error);
    return res.status(500).json({ message: "We could not submit the booking request right now." });
  }
}