import Head from "next/head";
import Link from "next/link";
import Center from "@/components/Center";
import Header from "@/components/Header";
import {
  readHotelReservationAccessToken,
  verifyHotelReservationAccessToken,
} from "@/lib/hotelReservationAccess";
import { mongooseConnect } from "@/lib/mongoose";
import HotelTableReservation from "@/models/HotelTableReservation";
import { PUBLIC_SITE_KEYS, getPublicSiteConfig, getPublicSitePath } from "@/lib/publicSite";

export default function HotelTableReservationConfirmationPage({ site, reservation }) {
  return (
    <>
      <Head>
        <title>{`Table Request Received | ${site.displayName}`}</title>
      </Head>
      <Header siteKey={site.key} />
      <Center>
        <div className="hotel-page min-h-screen px-4 py-8 sm:px-8 sm:py-10">
          <section className="hotel-shell mx-auto max-w-3xl rounded-[2rem] p-6 text-center md:p-8">
            <span className="hotel-shell-kicker inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] shadow-sm">
              Lounge desk
            </span>
            <h1 className="mt-4 text-3xl font-bold text-[#fff1dc] sm:text-4xl">Table request received</h1>
            <p className="hotel-shell-muted mt-3 text-base leading-8">
              We have received your table request and sent a confirmation to {reservation.email}. The hotel team will follow up to confirm seating and timing.
            </p>

            <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
              <div className="hotel-card rounded-[1.4rem] px-5 py-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-[rgba(18,52,60,0.52)]">Guest</p>
                <p className="mt-2 text-lg font-bold text-[var(--foreground-strong)]">{reservation.guestName}</p>
                <p className="hotel-muted-page mt-1 text-sm">{reservation.phone}</p>
              </div>
              <div className="hotel-card rounded-[1.4rem] px-5 py-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-[rgba(18,52,60,0.52)]">Reference ID</p>
                <p className="mt-2 break-all text-lg font-bold text-[var(--foreground-strong)]">{reservation.reference}</p>
                <p className="hotel-muted-page mt-1 text-sm">Keep this reference for changes or cancellation.</p>
              </div>
              <div className="hotel-card rounded-[1.4rem] px-5 py-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-[rgba(18,52,60,0.52)]">Reservation time</p>
                <p className="mt-2 text-lg font-bold text-[var(--foreground-strong)]">{reservation.reservationDate} at {reservation.reservationTime}</p>
              </div>
              <div className="hotel-card rounded-[1.4rem] px-5 py-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-[rgba(18,52,60,0.52)]">Party size</p>
                <p className="mt-2 text-lg font-bold text-[var(--foreground-strong)]">{reservation.partySize} guest{reservation.partySize === 1 ? "" : "s"}</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href={getPublicSitePath(PUBLIC_SITE_KEYS.HOTEL, "/lounge")} className="hotel-button-ghost inline-flex min-h-[3rem] items-center justify-center rounded-[1rem] px-5 py-3 text-sm font-semibold">
                Back to lounge
              </Link>
              <Link href={getPublicSitePath(PUBLIC_SITE_KEYS.HOTEL, "/manage-bookings")} className="hotel-button-primary inline-flex min-h-[3rem] items-center justify-center rounded-[1rem] px-5 py-3 text-sm font-semibold">
                Manage reservations
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

    if (!reservationId || !tokenPayload || tokenPayload.kind !== "table" || tokenPayload.reservationId !== reservationId) {
      return { notFound: true };
    }

    await mongooseConnect();
    const reservation = await HotelTableReservation.findById(reservationId);

    if (
      !reservation ||
      !verifyHotelReservationAccessToken(token, {
        reservationId: reservation._id,
        email: reservation.email,
        kind: "table",
        createdAt: reservation.createdAt,
      })
    ) {
      return { notFound: true };
    }

    return {
      props: {
        site: getPublicSiteConfig(PUBLIC_SITE_KEYS.HOTEL),
        reservation: {
          reference: String(reservation._id),
          guestName: reservation.guestName,
          email: reservation.email,
          phone: reservation.phone,
          reservationDate: reservation.reservationDate.toISOString().slice(0, 10),
          reservationTime: reservation.reservationTime,
          partySize: reservation.partySize,
        },
      },
    };
  } catch (error) {
    console.error("Hotel table reservation confirmation SSR error:", error);
    return { notFound: true };
  }
}