import crypto from "crypto";

/**
 * Signing keys for customer sessions and access links.
 *
 * Set CUSTOMER_SESSION_SECRET (a long random string) in every environment.
 * Until it is set, a key is derived from PAYSTACK_SECRET_KEY with a purpose
 * label, so the Paystack key itself is never used to sign anything and each
 * kind of token gets its own key. There is no hard-coded fallback in production.
 */
export function getSigningSecret(purpose) {
  const configured = process.env.CUSTOMER_SESSION_SECRET?.trim();
  const base = configured || process.env.PAYSTACK_SECRET_KEY?.trim();

  if (base) {
    return crypto.createHash("sha256").update(`${purpose}:${base}`).digest("hex");
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("CUSTOMER_SESSION_SECRET must be set to sign customer sessions and links.");
  }

  return `local-development-only:${purpose}`;
}

/**
 * Keys that earlier builds used, so links already emailed to guests (hotel
 * bookings) keep working until they expire. Only used to verify, never to sign.
 */
export function getLegacySigningSecrets(legacyFallback) {
  return [
    process.env.HOTEL_RESERVATION_ACCESS_SECRET,
    process.env.CUSTOMER_SESSION_SECRET,
    process.env.PAYSTACK_SECRET_KEY,
    process.env.MONGODB_URI,
    process.env.NODE_ENV === "production" ? null : legacyFallback,
  ].filter(Boolean);
}

export function hmacBase64Url(secret, value) {
  return crypto
    .createHmac("sha256", secret)
    .update(String(value))
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ""));
  const rightBuffer = Buffer.from(String(right || ""));
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}
