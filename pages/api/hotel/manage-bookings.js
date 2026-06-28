import mongoose from "mongoose";
import { mongooseConnect } from "@/lib/mongoose";
import HotelBooking from "@/models/HotelBooking";
import HotelTableReservation from "@/models/HotelTableReservation";
import { createMailTransport, getMailFromAddress } from "@/lib/mail";
import { buildHotelManageBookingsUrl } from "@/lib/hotelReservationAccess";
import { createHotelEmailHtml, HOTEL_BRAND_NAME } from "@/lib/hotelEmailTemplates";
import { STORE_DETAILS } from "@/lib/storeDetails";
import { normalizeCustomerEmail } from "@/lib/customerAuth";

function normalizeReference(value) {
  return typeof value === "string" ? value.trim() : "";
}

function serializeStayBooking(booking) {
  return {
    kind: "stay",
    _id: booking._id,
    reference: String(booking._id),
    status: booking.status,
    guestName: booking.guestName,
    email: booking.email,
    phone: booking.phone,
    roomName: booking.roomName || "Any available room",
    checkInDate: booking.checkInDate,
    checkOutDate: booking.checkOutDate,
    nights: booking.nights,
    adults: booking.adults,
    children: booking.children,
    preferredArrivalTime: booking.preferredArrivalTime,
    specialRequests: booking.specialRequests,
    canCancel: booking.status === "requested" || booking.status === "confirmed",
    createdAt: booking.createdAt,
  };
}

function serializeTableReservation(reservation) {
  return {
    kind: "table",
    _id: reservation._id,
    reference: String(reservation._id),
    status: reservation.status,
    guestName: reservation.guestName,
    email: reservation.email,
    phone: reservation.phone,
    reservationDate: reservation.reservationDate,
    reservationTime: reservation.reservationTime,
    partySize: reservation.partySize,
    areaPreference: reservation.areaPreference,
    occasion: reservation.occasion,
    specialRequests: reservation.specialRequests,
    canCancel: reservation.status === "requested" || reservation.status === "confirmed",
    createdAt: reservation.createdAt,
  };
}

async function sendCancellationEmails({ kind, reservation, req }) {
  try {
    const transporter = createMailTransport();
    if (!transporter) {
      return;
    }

    const manageUrl = buildHotelManageBookingsUrl(req);
    const summaryLines =
      kind === "stay"
        ? [
            `Booking ID: ${reservation._id}`,
            `Guest: ${reservation.guestName}`,
            `Room: ${reservation.roomName || "Any available room"}`,
            `Stay: ${reservation.checkInDate.toISOString().slice(0, 10)} to ${reservation.checkOutDate.toISOString().slice(0, 10)}`,
            `Guests: ${reservation.adults} adult${reservation.adults === 1 ? "" : "s"}${reservation.children ? `, ${reservation.children} child${reservation.children === 1 ? "" : "ren"}` : ""}`,
            `Phone: ${reservation.phone}`,
            reservation.preferredArrivalTime ? `Arrival: ${reservation.preferredArrivalTime}` : null,
            reservation.specialRequests ? `Notes: ${reservation.specialRequests}` : null,
          ]
        : [
            `Reservation ID: ${reservation._id}`,
            `Guest: ${reservation.guestName}`,
            `Date: ${reservation.reservationDate.toISOString().slice(0, 10)}`,
            `Time: ${reservation.reservationTime}`,
            `Party size: ${reservation.partySize}`,
            `Phone: ${reservation.phone}`,
            reservation.areaPreference ? `Area: ${reservation.areaPreference}` : null,
            reservation.occasion ? `Occasion: ${reservation.occasion}` : null,
            reservation.specialRequests ? `Notes: ${reservation.specialRequests}` : null,
          ];

    const summary = [...summaryLines, manageUrl ? `Manage reservations: ${manageUrl}` : null]
      .filter(Boolean)
      .join("\n");
    const rows = [
      { label: kind === "stay" ? "Booking ID" : "Reservation ID", value: String(reservation._id) },
      { label: "Guest", value: reservation.guestName },
      kind === "stay"
        ? { label: "Stay", value: `${reservation.checkInDate.toISOString().slice(0, 10)} to ${reservation.checkOutDate.toISOString().slice(0, 10)}` }
        : { label: "Date", value: reservation.reservationDate.toISOString().slice(0, 10) },
      kind === "stay"
        ? { label: "Room", value: reservation.roomName || "Any available room" }
        : { label: "Time", value: reservation.reservationTime },
      kind === "stay"
        ? {
            label: "Guests",
            value: `${reservation.adults} adult${reservation.adults === 1 ? "" : "s"}${reservation.children ? `, ${reservation.children} child${reservation.children === 1 ? "" : "ren"}` : ""}`,
          }
        : { label: "Party size", value: String(reservation.partySize) },
      { label: "Phone", value: reservation.phone },
    ].filter(Boolean);

    await Promise.all([
      transporter.sendMail({
        from: getMailFromAddress(HOTEL_BRAND_NAME),
        to: STORE_DETAILS.email,
        subject:
          kind === "stay"
            ? `Hotel booking cancelled by guest: ${reservation.roomName || "Stay request"}`
            : `Lounge reservation cancelled by guest: ${reservation.guestName}`,
        text: `A guest cancelled a ${kind === "stay" ? "room booking" : "table reservation"} request.\n\n${summary}`,
        html: createHotelEmailHtml({
          eyebrow: kind === "stay" ? "Room booking cancelled" : "Lounge reservation cancelled",
          title: kind === "stay" ? "A guest cancelled a stay request" : "A guest cancelled a table request",
          intro: `A guest has cancelled a ${kind === "stay" ? "room booking" : "table reservation"} request for ${HOTEL_BRAND_NAME}.`,
          rows,
          primaryAction: manageUrl ? { label: "Manage reservations", href: manageUrl } : null,
          closing: "Review the reservation dashboard if any further staff action is required.",
        }),
      }),
      transporter.sendMail({
        from: getMailFromAddress(HOTEL_BRAND_NAME),
        to: reservation.email,
        subject:
          kind === "stay"
            ? "Your hotel booking request has been cancelled"
            : "Your lounge reservation has been cancelled",
        text: `Hi ${reservation.guestName},\n\nYour ${kind === "stay" ? "hotel booking request" : "lounge reservation"} has been cancelled successfully.\n\n${summary}\n\nIf you need a new reservation, you can submit another request at any time.`,
        html: createHotelEmailHtml({
          eyebrow: kind === "stay" ? "Stay request cancelled" : "Lounge request cancelled",
          title: kind === "stay" ? "Your booking request has been cancelled" : "Your table request has been cancelled",
          greeting: `Hi ${reservation.guestName},`,
          intro: `Your ${kind === "stay" ? "hotel booking request" : "lounge reservation"} has been cancelled successfully.`,
          rows,
          primaryAction: manageUrl ? { label: "Manage reservations", href: manageUrl } : null,
          closing: "If you need a new reservation, you can submit another request at any time.",
        }),
      }),
    ]);
  } catch (error) {
    console.error("Hotel reservation cancellation email failed (non-critical):", error.message);
  }
}

async function findReservationByReference(reference, email) {
  if (!mongoose.isValidObjectId(reference)) {
    return null;
  }

  const [stayBooking, tableReservation] = await Promise.all([
    HotelBooking.findOne({ _id: reference, email }),
    HotelTableReservation.findOne({ _id: reference, email }),
  ]);

  if (stayBooking) {
    return { kind: "stay", document: stayBooking };
  }

  if (tableReservation) {
    return { kind: "table", document: tableReservation };
  }

  return null;
}

export default async function handler(req, res) {
  if (!["GET", "PATCH"].includes(req.method)) {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  await mongooseConnect();

  const reference = normalizeReference(req.method === "GET" ? req.query.reference : req.body.reference);
  const email = normalizeCustomerEmail(req.method === "GET" ? req.query.email : req.body.email);

  if (!reference || !email) {
    return res.status(400).json({ message: "Reference ID and email are required." });
  }

  try {
    const foundReservation = await findReservationByReference(reference, email);

    if (!foundReservation) {
      return res.status(404).json({ message: "We could not find a reservation matching that reference and email." });
    }

    if (req.method === "GET") {
      return res.status(200).json(
        foundReservation.kind === "stay"
          ? serializeStayBooking(foundReservation.document)
          : serializeTableReservation(foundReservation.document)
      );
    }

    const action = normalizeReference(req.body.action).toLowerCase();
    if (action !== "cancel") {
      return res.status(400).json({ message: "Unsupported action." });
    }

    if (!["requested", "confirmed"].includes(foundReservation.document.status)) {
      return res.status(409).json({ message: "This reservation can no longer be cancelled from the website." });
    }

    foundReservation.document.status = "cancelled";
    foundReservation.document.cancelledAt = new Date();
    await foundReservation.document.save();
    await sendCancellationEmails({
      kind: foundReservation.kind,
      reservation: foundReservation.document,
      req,
    });

    return res.status(200).json(
      foundReservation.kind === "stay"
        ? serializeStayBooking(foundReservation.document)
        : serializeTableReservation(foundReservation.document)
    );
  } catch (error) {
    console.error("Hotel reservation management error:", error);
    return res.status(500).json({ message: "We could not manage that reservation right now." });
  }
}