import crypto from "crypto";
import { normalizeCustomerEmail } from "@/lib/customerAuth";
import { PUBLIC_SITE_KEYS, getPublicSitePath } from "@/lib/publicSite";

const ACCESS_TOKEN_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

function getAccessSecret() {
  return (
    process.env.HOTEL_RESERVATION_ACCESS_SECRET ||
    process.env.CUSTOMER_SESSION_SECRET ||
    process.env.PAYSTACK_SECRET_KEY ||
    process.env.MONGODB_URI ||
    "local-hotel-reservation-access-secret"
  );
}

function toBase64Url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value) {
  const normalizedValue = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalizedValue.length % 4;
  const paddedValue = padding
    ? normalizedValue + "=".repeat(4 - padding)
    : normalizedValue;

  return Buffer.from(paddedValue, "base64").toString("utf8");
}

function signValue(value) {
  return toBase64Url(
    crypto.createHmac("sha256", getAccessSecret()).update(value).digest()
  );
}

function toTimestamp(value) {
  if (!value) {
    return null;
  }

  const parsedValue = new Date(value);
  return Number.isNaN(parsedValue.getTime()) ? null : parsedValue.getTime();
}

export function createHotelReservationAccessToken({
  reservationId,
  email,
  kind,
  createdAt,
  expiresAt = Date.now() + ACCESS_TOKEN_MAX_AGE_MS,
}) {
  const payload = {
    reservationId: String(reservationId || ""),
    email: normalizeCustomerEmail(email),
    kind: String(kind || ""),
    createdAt: toTimestamp(createdAt),
    expiresAt,
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signValue(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function readHotelReservationAccessToken(token) {
  if (!token || typeof token !== "string") {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signValue(encodedPayload);
  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(signature);

  if (
    expectedBuffer.length !== receivedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload));
    if (
      !payload?.reservationId ||
      !payload?.email ||
      !payload?.kind ||
      !payload?.createdAt ||
      !payload?.expiresAt ||
      payload.expiresAt < Date.now()
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function verifyHotelReservationAccessToken(token, expectedValues) {
  const payload = readHotelReservationAccessToken(token);
  if (!payload) {
    return false;
  }

  const expectedCreatedAt = toTimestamp(expectedValues.createdAt);
  return (
    payload.reservationId === String(expectedValues.reservationId || "") &&
    payload.kind === String(expectedValues.kind || "") &&
    payload.email === normalizeCustomerEmail(expectedValues.email) &&
    payload.createdAt === expectedCreatedAt
  );
}

function resolveBaseUrl(req) {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "";
  const forwardedHost = req?.headers?.["x-forwarded-host"];
  const host = forwardedHost || req?.headers?.host || "";
  const forwardedProto = req?.headers?.["x-forwarded-proto"];
  const protocol = forwardedProto || (host.includes("localhost") ? "http" : "https");

  if (host) {
    return `${protocol}://${host}`;
  }

  return configuredBaseUrl.replace(/\/$/, "");
}

export function buildHotelManageBookingsUrl(req) {
  const baseUrl = resolveBaseUrl(req);
  if (!baseUrl) {
    return "";
  }

  return `${baseUrl}${getPublicSitePath(PUBLIC_SITE_KEYS.HOTEL, "/manage-bookings")}`;
}

export function buildHotelReservationConfirmationUrl({ req, reservationId, kind, token }) {
  const baseUrl = resolveBaseUrl(req);
  if (!baseUrl || !reservationId || !token) {
    return "";
  }

  const confirmationPath =
    kind === "table"
      ? getPublicSitePath(PUBLIC_SITE_KEYS.HOTEL, `/reserve-table/confirmation/${reservationId}`)
      : getPublicSitePath(PUBLIC_SITE_KEYS.HOTEL, `/booking/confirmation/${reservationId}`);

  return `${baseUrl}${confirmationPath}?token=${encodeURIComponent(token)}`;
}