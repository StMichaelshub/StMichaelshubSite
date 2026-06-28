import crypto from "crypto";
import Customer from "@/models/Customer";
import CustomerOtp from "@/models/CustomerOtp";
import {
  createMailTransport,
  getMailFromAddress,
  isMailDeliveryConfigured,
  maskEmailAddress,
} from "@/lib/mail";

export const CUSTOMER_SESSION_COOKIE = "st_michael_customer_session";
const OTP_EXPIRY_MINUTES = 10;
const OTP_COOLDOWN_SECONDS = 45;
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function getSessionSecret() {
  return (
    process.env.CUSTOMER_SESSION_SECRET ||
    process.env.PAYSTACK_SECRET_KEY ||
    process.env.MONGODB_URI ||
    "local-customer-session-secret"
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
  const normalizedValue = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalizedValue.length % 4;
  const paddedValue = padding
    ? normalizedValue + "=".repeat(4 - padding)
    : normalizedValue;

  return Buffer.from(paddedValue, "base64").toString("utf8");
}

function signValue(value) {
  return toBase64Url(
    crypto.createHmac("sha256", getSessionSecret()).update(value).digest()
  );
}

function createSessionCookieValue(payload) {
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signValue(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function parseSessionCookieValue(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const [encodedPayload, signature] = value.split(".");
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
    if (!payload?.customerId || !payload?.email || !payload?.expiresAt) {
      return null;
    }

    if (payload.expiresAt < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function buildCookieAttributes(maxAgeSeconds) {
  return [
    `${CUSTOMER_SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    process.env.NODE_ENV === "production" ? "Secure" : "",
    typeof maxAgeSeconds === "number" ? `Max-Age=${maxAgeSeconds}` : "",
  ]
    .filter(Boolean)
    .join("; ");
}

function formatCookie(cookieName, value, maxAgeSeconds) {
  return [
    `${cookieName}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    process.env.NODE_ENV === "production" ? "Secure" : "",
    typeof maxAgeSeconds === "number" ? `Max-Age=${maxAgeSeconds}` : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function normalizeCustomerEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

export { maskEmailAddress };

export function parseCookies(cookieHeader = "") {
  return cookieHeader
    .split(";")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .reduce((accumulator, chunk) => {
      const separatorIndex = chunk.indexOf("=");
      if (separatorIndex === -1) {
        return accumulator;
      }

      const key = chunk.slice(0, separatorIndex).trim();
      const value = chunk.slice(separatorIndex + 1).trim();
      accumulator[key] = decodeURIComponent(value);
      return accumulator;
    }, {});
}

export function getSessionPayloadFromRequest(req) {
  const cookies = parseCookies(req.headers.cookie || "");
  return parseSessionCookieValue(cookies[CUSTOMER_SESSION_COOKIE]);
}

export async function getAuthenticatedCustomerFromRequest(req) {
  const session = getSessionPayloadFromRequest(req);
  if (!session) {
    return null;
  }

  const customer = await Customer.findById(session.customerId).lean();
  if (!customer || normalizeCustomerEmail(customer.email) !== session.email) {
    return null;
  }

  return customer;
}

export async function requireAuthenticatedCustomer(req, res) {
  const customer = await getAuthenticatedCustomerFromRequest(req);
  if (!customer) {
    res.status(401).json({ message: "Sign in to continue." });
    return null;
  }

  return customer;
}

export function setCustomerSessionCookie(res, customer) {
  const payload = {
    customerId: String(customer._id),
    email: normalizeCustomerEmail(customer.email),
    expiresAt: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  };

  const cookieValue = createSessionCookieValue(payload);
  res.setHeader(
    "Set-Cookie",
    formatCookie(CUSTOMER_SESSION_COOKIE, cookieValue, SESSION_MAX_AGE_SECONDS)
  );
}

export function clearCustomerSessionCookie(res) {
  res.setHeader(
    "Set-Cookie",
    formatCookie(CUSTOMER_SESSION_COOKIE, "", 0)
  );
}

export function generateOtpCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

export function hashOtpCode(code) {
  return crypto.createHash("sha256").update(String(code)).digest("hex");
}

export async function getRecentActiveOtp(email) {
  return CustomerOtp.findOne({
    email,
    purpose: "LOGIN",
    consumedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  })
    .sort({ createdAt: -1 })
    .lean();
}

export async function createLoginOtp(customer) {
  const email = normalizeCustomerEmail(customer.email);
  const recentOtp = await getRecentActiveOtp(email);
  if (recentOtp) {
    const ageInSeconds = Math.floor(
      (Date.now() - new Date(recentOtp.createdAt).getTime()) / 1000
    );

    if (ageInSeconds < OTP_COOLDOWN_SECONDS) {
      const waitSeconds = OTP_COOLDOWN_SECONDS - ageInSeconds;
      const error = new Error(`Please wait ${waitSeconds} seconds before requesting another code.`);
      error.statusCode = 429;
      throw error;
    }
  }

  await CustomerOtp.deleteMany({ email, purpose: "LOGIN", consumedAt: { $exists: false } });

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await CustomerOtp.create({
    customer: customer._id,
    email,
    purpose: "LOGIN",
    codeHash: hashOtpCode(code),
    expiresAt,
  });

  return {
    code,
    expiresAt,
    expiresInMinutes: OTP_EXPIRY_MINUTES,
  };
}

export async function deliverLoginOtp({ customer, code }) {
  const email = normalizeCustomerEmail(customer.email);
  const subject = "Your St Michael's Food & Drinks Warehouse sign-in code";
  const text = `Hi ${customer.name || "there"},\n\nUse this one-time code to sign in to your St Michael's Food & Drinks Warehouse account: ${code}\n\nThis code expires in ${OTP_EXPIRY_MINUTES} minutes.\n\nIf you did not request this code, you can ignore this message.`;
  const transporter = createMailTransport();

  if (!transporter) {
    if (process.env.NODE_ENV === "production") {
      const error = new Error(
        "Email delivery is not configured right now. Please contact support or try again later."
      );
      error.statusCode = 503;
      throw error;
    }

    console.log(`Login OTP for ${email}: ${code}`);
    return { method: "console", target: email };
  }

  try {
    await transporter.sendMail({
      from: getMailFromAddress("St Michael's Food & Drinks Warehouse"),
      to: email,
      subject,
      text,
    });

    return { method: "email", target: email };
  } catch (deliveryError) {
    if (!isMailDeliveryConfigured() || process.env.NODE_ENV === "production") {
      const error = new Error(
        "We could not deliver the sign-in code email right now. Please try again shortly."
      );
      error.statusCode = 502;
      throw error;
    }

    console.error(`Login OTP email failed for ${email}:`, deliveryError.message);
    console.log(`Login OTP for ${email}: ${code}`);
    return { method: "console", target: email };
  }
}

export async function consumeLoginOtp({ email, code }) {
  const normalizedEmail = normalizeCustomerEmail(email);
  const otpRecord = await CustomerOtp.findOne({
    email: normalizedEmail,
    purpose: "LOGIN",
    consumedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  const expectedCodeHash = hashOtpCode(code);
  const storedHashBuffer = Buffer.from(otpRecord?.codeHash || "", "hex");
  const expectedHashBuffer = Buffer.from(expectedCodeHash, "hex");

  if (
    !otpRecord ||
    storedHashBuffer.length !== expectedHashBuffer.length ||
    !crypto.timingSafeEqual(storedHashBuffer, expectedHashBuffer)
  ) {
    return null;
  }

  otpRecord.consumedAt = new Date();
  await otpRecord.save();

  const customer = await Customer.findByIdAndUpdate(
    otpRecord.customer,
    { $set: { lastLoginAt: new Date() } },
    { new: true }
  );

  return customer;
}