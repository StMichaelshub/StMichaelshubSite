import Head from "next/head";
import axios from "axios";
import { useState } from "react";
import Center from "@/components/Center";
import Header from "@/components/Header";
import { PUBLIC_SITE_KEYS, getPublicSiteConfig } from "@/lib/publicSite";

function formatDate(value) {
  if (!value) {
    return "Not available";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return String(value);
  }

  return parsedDate.toISOString().slice(0, 10);
}

export default function HotelManageBookingsPage({ site }) {
  const [formValues, setFormValues] = useState({ reference: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [reservation, setReservation] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  async function handleLookup(event) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      const response = await axios.get("/api/hotel/manage-bookings", {
        params: formValues,
      });
      setReservation(response.data);
    } catch (error) {
      setReservation(null);
      setErrorMessage(
        error.response?.data?.message || "We could not find that reservation right now."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelReservation() {
    if (!reservation) {
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      const response = await axios.patch("/api/hotel/manage-bookings", {
        reference: reservation.reference,
        email: reservation.email,
        action: "cancel",
      });
      setReservation(response.data);
      setInfoMessage("The reservation has been cancelled.");
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "We could not cancel that reservation right now."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Head>
        <title>{`Manage Bookings | ${site.displayName}`}</title>
      </Head>
      <Header siteKey={site.key} />
      <Center>
        <div className="hotel-page min-h-screen px-4 py-8 sm:px-8 sm:py-10">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="hotel-shell rounded-[2rem] p-6 md:p-8">
              <span className="hotel-shell-kicker inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] shadow-sm">
                Reservation lookup
              </span>
              <h1 className="mt-4 text-3xl font-bold text-[#fff1dc] sm:text-4xl">Manage your stay or table request</h1>
              <p className="hotel-shell-muted mt-3 text-base leading-8">
                Enter the request ID and the same email used when you submitted the reservation. You can review the details and cancel requests that are still open.
              </p>

              <form className="mt-6 grid gap-4" onSubmit={handleLookup}>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[var(--foreground-strong)]">Reference ID</span>
                  <input
                    type="text"
                    value={formValues.reference}
                    onChange={(event) => setFormValues((currentValue) => ({ ...currentValue, reference: event.target.value }))}
                    className="hotel-input-light rounded-2xl px-4 py-3 outline-none"
                    required
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-[var(--foreground-strong)]">Email address</span>
                  <input
                    type="email"
                    value={formValues.email}
                    onChange={(event) => setFormValues((currentValue) => ({ ...currentValue, email: event.target.value }))}
                    className="hotel-input-light rounded-2xl px-4 py-3 outline-none"
                    required
                  />
                </label>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`hotel-button-primary inline-flex min-h-[3.2rem] items-center justify-center rounded-[1rem] px-5 py-3 text-sm font-semibold ${submitting ? "opacity-70" : ""}`}
                >
                  {submitting ? "Checking request..." : "Find reservation"}
                </button>
              </form>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  "Works for room stays and table reservations",
                  "Cancellation is available while the request is still open",
                  "Use the same email used at submission time",
                  "Contact the hotel if you need same-day changes",
                ].map((item) => (
                  <div key={item} className="hotel-shell-card rounded-[1.3rem] px-4 py-4 text-sm font-semibold text-[#fff1dc]">
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section className="hotel-section rounded-[2rem] p-6 md:p-8">
              <h2 className="text-2xl font-bold text-[var(--foreground-strong)]">Reservation details</h2>
              <p className="hotel-muted-page mt-2">Lookup results will appear here.</p>

              {errorMessage ? (
                <div className="mt-5 rounded-[1.2rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              ) : null}

              {infoMessage ? (
                <div className="mt-5 rounded-[1.2rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {infoMessage}
                </div>
              ) : null}

              {reservation ? (
                <div className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="hotel-card rounded-[1.35rem] px-5 py-4 shadow-sm">
                      <p className="text-xs uppercase tracking-[0.22em] text-[rgba(18,52,60,0.52)]">Reservation type</p>
                      <p className="mt-2 text-lg font-bold text-[var(--foreground-strong)]">{reservation.kind === "stay" ? "Room stay" : "Table reservation"}</p>
                    </div>
                    <div className="hotel-card rounded-[1.35rem] px-5 py-4 shadow-sm">
                      <p className="text-xs uppercase tracking-[0.22em] text-[rgba(18,52,60,0.52)]">Status</p>
                      <p className="mt-2 text-lg font-bold text-[var(--foreground-strong)]">{reservation.status}</p>
                    </div>
                    <div className="hotel-card rounded-[1.35rem] px-5 py-4 shadow-sm sm:col-span-2">
                      <p className="text-xs uppercase tracking-[0.22em] text-[rgba(18,52,60,0.52)]">Reference ID</p>
                      <p className="mt-2 break-all text-lg font-bold text-[var(--foreground-strong)]">{reservation.reference}</p>
                    </div>
                  </div>

                  <div className="hotel-card rounded-[1.5rem] px-5 py-5 shadow-sm">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-[rgba(18,52,60,0.52)]">Guest</p>
                        <p className="mt-2 text-base font-semibold text-[var(--foreground-strong)]">{reservation.guestName}</p>
                        <p className="hotel-muted-page mt-1 text-sm">{reservation.email}</p>
                        <p className="hotel-muted-page mt-1 text-sm">{reservation.phone}</p>
                      </div>

                      {reservation.kind === "stay" ? (
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-[rgba(18,52,60,0.52)]">Stay details</p>
                          <p className="mt-2 text-base font-semibold text-[var(--foreground-strong)]">{reservation.roomName}</p>
                          <p className="hotel-muted-page mt-1 text-sm">{formatDate(reservation.checkInDate)} to {formatDate(reservation.checkOutDate)}</p>
                          <p className="hotel-muted-page mt-1 text-sm">{reservation.nights} night{reservation.nights === 1 ? "" : "s"} · {reservation.adults} adult{reservation.adults === 1 ? "" : "s"}{reservation.children ? `, ${reservation.children} child${reservation.children === 1 ? "" : "ren"}` : ""}</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-[rgba(18,52,60,0.52)]">Table details</p>
                          <p className="mt-2 text-base font-semibold text-[var(--foreground-strong)]">{formatDate(reservation.reservationDate)} at {reservation.reservationTime}</p>
                          <p className="hotel-muted-page mt-1 text-sm">Party of {reservation.partySize}</p>
                          <p className="hotel-muted-page mt-1 text-sm">{reservation.areaPreference || reservation.occasion || "General lounge reservation"}</p>
                        </div>
                      )}
                    </div>

                    {reservation.specialRequests || reservation.preferredArrivalTime || reservation.occasion || reservation.areaPreference ? (
                      <div className="hotel-card-soft hotel-muted-page mt-4 rounded-[1.2rem] px-4 py-4 text-sm">
                        {reservation.preferredArrivalTime ? <p><span className="font-semibold text-[var(--foreground-strong)]">Arrival:</span> {reservation.preferredArrivalTime}</p> : null}
                        {reservation.areaPreference ? <p><span className="font-semibold text-[var(--foreground-strong)]">Area:</span> {reservation.areaPreference}</p> : null}
                        {reservation.occasion ? <p><span className="font-semibold text-[var(--foreground-strong)]">Occasion:</span> {reservation.occasion}</p> : null}
                        {reservation.specialRequests ? <p><span className="font-semibold text-[var(--foreground-strong)]">Notes:</span> {reservation.specialRequests}</p> : null}
                      </div>
                    ) : null}

                    {reservation.canCancel ? (
                      <button
                        type="button"
                        onClick={handleCancelReservation}
                        disabled={submitting}
                        className={`hotel-button-secondary mt-5 inline-flex min-h-[3rem] items-center justify-center rounded-[1rem] px-5 py-3 text-sm font-semibold ${submitting ? "opacity-70" : ""}`}
                      >
                        {submitting ? "Updating..." : "Cancel reservation"}
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-[1.5rem] border border-dashed border-[rgba(188,133,34,0.22)] px-6 py-12 text-center">
                  <p className="hotel-muted-page">No reservation loaded yet.</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </Center>
    </>
  );
}

export async function getServerSideProps() {
  return {
    props: {
      site: getPublicSiteConfig(PUBLIC_SITE_KEYS.HOTEL),
    },
  };
}