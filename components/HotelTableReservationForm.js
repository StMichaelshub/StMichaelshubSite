import axios from "axios";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { PUBLIC_SITE_KEYS, getPublicSitePath } from "@/lib/publicSite";

function addDays(value, days) {
  const nextDate = new Date(value);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function formatDateInput(value) {
  return new Date(value.getTime() - value.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function openNativePicker(event) {
  event.currentTarget.showPicker?.();
}

function preventManualPickerEntry(event) {
  if (event.type === "paste") {
    event.preventDefault();
    return;
  }

  if (!["Tab", "Escape"].includes(event.key)) {
    event.preventDefault();
  }
}

export default function HotelTableReservationForm({
  title = "Reserve a table",
  intro = "Send a lounge table request directly to the hotel and we will confirm your table shortly.",
  submitLabel = "Send table request",
}) {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  const defaultReservationDate = useMemo(() => formatDateInput(addDays(today, 1)), [today]);
  const [formValues, setFormValues] = useState({
    guestName: "",
    email: "",
    phone: "",
    reservationDate: defaultReservationDate,
    reservationTime: "7:00 PM",
    partySize: "2",
    areaPreference: "",
    occasion: "",
    specialRequests: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const pickerInputProps = {
    inputMode: "none",
    onClick: openNativePicker,
    onFocus: openNativePicker,
    onKeyDown: preventManualPickerEntry,
    onPaste: preventManualPickerEntry,
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");

    try {
      const response = await axios.post("/api/hotel/table-reservations", formValues);
      const confirmationQuery = response.data.accessToken
        ? `?token=${encodeURIComponent(response.data.accessToken)}`
        : "";
      await router.push(
        `${getPublicSitePath(PUBLIC_SITE_KEYS.HOTEL, `/reserve-table/confirmation/${response.data.reservationId}`)}${confirmationQuery}`
      );
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "We could not send the table reservation right now."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="hotel-section rounded-[1.75rem] p-6 sm:p-8">
      <div className="hotel-divider border-b pb-5">
        <span className="hotel-kicker inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] shadow-sm">
          Lounge reservations
        </span>
        <h2 className="mt-4 text-2xl font-bold text-[var(--foreground-strong)] sm:text-3xl">{title}</h2>
        <p className="hotel-muted-page mt-2 max-w-2xl text-sm leading-7 sm:text-base sm:leading-8">{intro}</p>
      </div>

      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[var(--foreground-strong)]">Guest name</span>
            <input
              type="text"
              value={formValues.guestName}
              onChange={(event) => setFormValues((currentValue) => ({ ...currentValue, guestName: event.target.value }))}
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
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[var(--foreground-strong)]">Phone number</span>
            <input
              type="tel"
              value={formValues.phone}
              onChange={(event) => setFormValues((currentValue) => ({ ...currentValue, phone: event.target.value }))}
              className="hotel-input-light rounded-2xl px-4 py-3 outline-none"
              required
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[var(--foreground-strong)]">Party size</span>
            <select
              value={formValues.partySize}
              onChange={(event) => setFormValues((currentValue) => ({ ...currentValue, partySize: event.target.value }))}
              className="hotel-input-light rounded-2xl px-4 py-3 outline-none"
            >
              {[2, 3, 4, 5, 6, 8, 10].map((value) => (
                <option key={value} value={String(value)}>
                  {value} guests
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[var(--foreground-strong)]">Reservation date</span>
            <input
              type="date"
              value={formValues.reservationDate}
              min={defaultReservationDate}
              onChange={(event) => setFormValues((currentValue) => ({ ...currentValue, reservationDate: event.target.value }))}
              {...pickerInputProps}
              className="hotel-input-light rounded-2xl px-4 py-3 outline-none"
              required
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[var(--foreground-strong)]">Reservation time</span>
            <select
              value={formValues.reservationTime}
              onChange={(event) => setFormValues((currentValue) => ({ ...currentValue, reservationTime: event.target.value }))}
              className="hotel-input-light rounded-2xl px-4 py-3 outline-none"
            >
              {["1:00 PM", "3:00 PM", "5:00 PM", "7:00 PM", "9:00 PM"].map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[var(--foreground-strong)]">Area preference</span>
            <select
              value={formValues.areaPreference}
              onChange={(event) => setFormValues((currentValue) => ({ ...currentValue, areaPreference: event.target.value }))}
              className="hotel-input-light rounded-2xl px-4 py-3 outline-none"
            >
              <option value="">No preference</option>
              <option value="Indoor lounge">Indoor lounge</option>
              <option value="Window-side seating">Window-side seating</option>
              <option value="Rooftop section">Rooftop section</option>
              <option value="Quiet corner">Quiet corner</option>
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[var(--foreground-strong)]">Occasion</span>
            <input
              type="text"
              value={formValues.occasion}
              onChange={(event) => setFormValues((currentValue) => ({ ...currentValue, occasion: event.target.value }))}
              placeholder="Birthday dinner, business meeting, date night"
              className="hotel-input-light rounded-2xl px-4 py-3 outline-none"
            />
          </label>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-[var(--foreground-strong)]">Special requests</span>
          <textarea
            rows={4}
            value={formValues.specialRequests}
            onChange={(event) => setFormValues((currentValue) => ({ ...currentValue, specialRequests: event.target.value }))}
            placeholder="Dietary notes, celebration setup, accessibility needs, or service preferences."
            className="hotel-input-light rounded-2xl px-4 py-3 outline-none"
          />
        </label>

        {errorMessage ? (
          <div className="rounded-[1.2rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className={`hotel-button-primary inline-flex min-h-[3.2rem] items-center justify-center rounded-[1rem] px-5 py-3 text-sm font-semibold ${submitting ? "opacity-70" : ""}`}
        >
          {submitting ? "Sending request..." : submitLabel}
        </button>
      </form>
    </section>
  );
}