import Head from "next/head";
import Link from "next/link";
import Center from "@/components/Center";
import Header from "@/components/Header";
import {
  readHotelReservationAccessToken,
  verifyHotelReservationAccessToken,
} from "@/lib/hotelReservationAccess";
import { mongooseConnect } from "@/lib/mongoose";
import HotelBooking from "@/models/HotelBooking";
import { PUBLIC_SITE_KEYS, getPublicSiteConfig, getPublicSitePath } from "@/lib/publicSite";

export default function HotelBookingConfirmationPage({ site, booking }) {
  return (
    <>
      <Head>
        <title>{`Booking Request Received | ${site.displayName}`}</title>
      </Head>
      <Header siteKey={site.key} />
      <Center>
        <div className="hotel-page min-h-screen px-4 py-8 sm:px-8 sm:py-10">
          <section className="hotel-shell mx-auto max-w-3xl rounded-[2rem] p-6 text-center md:p-8">
            <span className="hotel-shell-kicker inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] shadow-sm">
              Reservations desk
            </span>
            <h1 className="mt-4 text-3xl font-bold text-[#fff1dc] sm:text-4xl">Booking request received</h1>
            <p className="hotel-shell-muted mt-3 text-base leading-8">
              We have received your stay request and sent a confirmation to {booking.email}. The hotel team will follow up to confirm availability and final arrival details.
            </p>

            <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
              <div className="hotel-card rounded-[1.4rem] px-5 py-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-[rgba(18,52,60,0.52)]">Guest</p>
                <p className="mt-2 text-lg font-bold text-[var(--foreground-strong)]">{booking.guestName}</p>
                <p className="hotel-muted-page mt-1 text-sm">{booking.phone}</p>
              </div>
              <div className="hotel-card rounded-[1.4rem] px-5 py-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-[rgba(18,52,60,0.52)]">Reference ID</p>
                <p className="mt-2 break-all text-lg font-bold text-[var(--foreground-strong)]">{booking.reference}</p>
                <p className="hotel-muted-page mt-1 text-sm">Keep this reference for changes or cancellation.</p>
              </div>
              <div className="hotel-card rounded-[1.4rem] px-5 py-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-[rgba(18,52,60,0.52)]">Requested room</p>
                <p className="mt-2 text-lg font-bold text-[var(--foreground-strong)]">{booking.roomName || "Any available room"}</p>
                <p className="hotel-muted-page mt-1 text-sm">{booking.nights} night{booking.nights === 1 ? "" : "s"}</p>
              </div>
              <div className="hotel-card rounded-[1.4rem] px-5 py-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-[rgba(18,52,60,0.52)]">Stay window</p>
                <p className="mt-2 text-lg font-bold text-[var(--foreground-strong)]">{booking.checkInDate} to {booking.checkOutDate}</p>
              </div>
              <div className="hotel-card rounded-[1.4rem] px-5 py-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-[rgba(18,52,60,0.52)]">Guests</p>
                <p className="mt-2 text-lg font-bold text-[var(--foreground-strong)]">{booking.adults} adult{booking.adults === 1 ? "" : "s"}{booking.children ? `, ${booking.children} child${booking.children === 1 ? "" : "ren"}` : ""}</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href={getPublicSitePath(PUBLIC_SITE_KEYS.HOTEL, "/rooms")} className="hotel-button-ghost inline-flex min-h-[3rem] items-center justify-center rounded-[1rem] px-5 py-3 text-sm font-semibold">
                Browse rooms again
              </Link>
              <Link href={getPublicSitePath(PUBLIC_SITE_KEYS.HOTEL, "/manage-bookings")} className="hotel-button-secondary inline-flex min-h-[3rem] items-center justify-center rounded-[1rem] px-5 py-3 text-sm font-semibold">
                Manage bookings
              </Link>
              <Link href={getPublicSitePath(PUBLIC_SITE_KEYS.HOTEL, "/contact")} className="hotel-button-primary inline-flex min-h-[3rem] items-center justify-center rounded-[1rem] px-5 py-3 text-sm font-semibold">
                Contact reservations
              </Link>
            </div>
          </section>
        </div>
      </Center>
    </>
  );
}

export async function getServerSideProps(context) {
  try {
    const reservationId = Array.isArray(context.query.id) ? context.query.id[0] : context.query.id;
    const token = Array.isArray(context.query.token) ? context.query.token[0] : context.query.token;
    const tokenPayload = readHotelReservationAccessToken(token);

    if (!reservationId || !tokenPayload || tokenPayload.kind !== "stay" || tokenPayload.reservationId !== reservationId) {
      return { notFound: true };
    }

    await mongooseConnect();
    const booking = await HotelBooking.findById(reservationId);

    if (
      !booking ||
      !verifyHotelReservationAccessToken(token, {
        reservationId: booking._id,
        email: booking.email,
        kind: "stay",
        createdAt: booking.createdAt,
      })
    ) {
      return { notFound: true };
    }

    return {
      props: {
        site: getPublicSiteConfig(PUBLIC_SITE_KEYS.HOTEL),
        booking: {
          reference: String(booking._id),
          guestName: booking.guestName,
          email: booking.email,
          phone: booking.phone,
          roomName: booking.roomName,
          nights: booking.nights,
          adults: booking.adults,
          children: booking.children,
          checkInDate: booking.checkInDate.toISOString().slice(0, 10),
          checkOutDate: booking.checkOutDate.toISOString().slice(0, 10),
        },
      },
    };
  } catch (error) {
    console.error("Hotel booking confirmation SSR error:", error);
    return { notFound: true };
  }
}