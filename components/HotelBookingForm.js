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

export default function HotelBookingForm({
  rooms,
  selectedRoomId = "",
  title = "Book your stay",
  intro = "Send a room request directly to the reservations desk and we will confirm availability shortly.",
  submitLabel = "Send booking request",
  compact = false,
}) {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  const defaultCheckIn = useMemo(() => formatDateInput(addDays(today, 1)), [today]);
  const defaultCheckOut = useMemo(() => formatDateInput(addDays(today, 2)), [today]);
  const [formValues, setFormValues] = useState({
    roomId: selectedRoomId,
    guestName: "",
    email: "",
    phone: "",
    checkInDate: defaultCheckIn,
    checkOutDate: defaultCheckOut,
    adults: "1",
    children: "0",
    preferredArrivalTime: "",
    specialRequests: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const queryRoomId = typeof router.query.roomId === "string" ? router.query.roomId : "";
  const effectiveRoomId = selectedRoomId || formValues.roomId || queryRoomId;
  const selectedRoom = (rooms || []).find((room) => String(room._id) === String(effectiveRoomId));
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
      const response = await axios.post("/api/hotel/bookings", {
        ...formValues,
        roomId: effectiveRoomId,
        roomName: selectedRoom?.name || "",
      });

      const confirmationQuery = response.data.accessToken
        ? `?token=${encodeURIComponent(response.data.accessToken)}`
        : "";

      await router.push(
        `${getPublicSitePath(PUBLIC_SITE_KEYS.HOTEL, `/booking/confirmation/${response.data.bookingId}`)}${confirmationQuery}`
      );
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "We could not send the booking request right now."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={`hotel-section rounded-[1.75rem] ${compact ? "p-5 sm:p-6" : "p-6 sm:p-8"}`}>
      <div className="hotel-divider border-b pb-5">
        <span className="hotel-kicker inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] shadow-sm">
          Reservations
        </span>
        <h2 className="mt-4 text-2xl font-bold text-[var(--foreground-strong)] sm:text-3xl">{title}</h2>
        <p className="hotel-muted-page mt-2 max-w-2xl text-sm leading-7 sm:text-base sm:leading-8">{intro}</p>
      </div>

      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        {selectedRoom ? (
          <div className="hotel-card-soft rounded-[1.35rem] px-5 py-4 text-sm text-[var(--foreground-strong)]">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[rgba(18,52,60,0.46)]">Selected room</p>
            <p className="mt-1 text-base font-semibold">{selectedRoom.name}</p>
          </div>
        ) : (
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[var(--foreground-strong)]">Room type</span>
            <select
              value={formValues.roomId}
              onChange={(event) => setFormValues((currentValue) => ({ ...currentValue, roomId: event.target.value }))}
              className="hotel-input-light rounded-2xl px-4 py-3 outline-none"
            >
              <option value="">Any available room</option>
              {(rooms || []).map((room) => (
                <option key={room._id} value={room._id}>
                  {room.name}
                </option>
              ))}
            </select>
          </label>
        )}

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
            <span className="text-sm font-semibold text-[var(--foreground-strong)]">Preferred arrival time</span>
            <input
              type="text"
              value={formValues.preferredArrivalTime}
              onChange={(event) => setFormValues((currentValue) => ({ ...currentValue, preferredArrivalTime: event.target.value }))}
              placeholder="Example: 6:00 PM"
              className="hotel-input-light rounded-2xl px-4 py-3 outline-none"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[var(--foreground-strong)]">Check-in date</span>
            <input
              type="date"
              value={formValues.checkInDate}
              min={defaultCheckIn}
              onChange={(event) => setFormValues((currentValue) => ({ ...currentValue, checkInDate: event.target.value }))}
              {...pickerInputProps}
              className="hotel-input-light rounded-2xl px-4 py-3 outline-none"
              required
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[var(--foreground-strong)]">Check-out date</span>
            <input
              type="date"
              value={formValues.checkOutDate}
              min={formValues.checkInDate || defaultCheckOut}
              onChange={(event) => setFormValues((currentValue) => ({ ...currentValue, checkOutDate: event.target.value }))}
              {...pickerInputProps}
              className="hotel-input-light rounded-2xl px-4 py-3 outline-none"
              required
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[var(--foreground-strong)]">Adults</span>
            <select
              value={formValues.adults}
              onChange={(event) => setFormValues((currentValue) => ({ ...currentValue, adults: event.target.value }))}
              className="hotel-input-light rounded-2xl px-4 py-3 outline-none"
            >
              {[1, 2, 3, 4].map((value) => (
                <option key={value} value={String(value)}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[var(--foreground-strong)]">Children</span>
            <select
              value={formValues.children}
              onChange={(event) => setFormValues((currentValue) => ({ ...currentValue, children: event.target.value }))}
              className="hotel-input-light rounded-2xl px-4 py-3 outline-none"
            >
              {[0, 1, 2, 3].map((value) => (
                <option key={value} value={String(value)}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-[var(--foreground-strong)]">Special requests</span>
          <textarea
            rows={4}
            value={formValues.specialRequests}
            onChange={(event) => setFormValues((currentValue) => ({ ...currentValue, specialRequests: event.target.value }))}
            placeholder="Airport pickup, early check-in request, extra bedding, or any other notes."
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