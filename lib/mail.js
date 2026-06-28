import nodemailer from "nodemailer";

function parsePort(value, fallbackValue) {
  const parsedValue = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsedValue) ? parsedValue : fallbackValue;
}

export function isMailDeliveryConfigured() {
  const hasSmtpConfig = Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT);
  const hasLegacyGmailConfig = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

  return hasSmtpConfig || hasLegacyGmailConfig;
}

export function createMailTransport() {
  if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parsePort(process.env.SMTP_PORT, 587),
      secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
          : undefined,
    });
  }

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  return null;
}

export function getMailFromAddress(defaultLabel = "St Michael's Food & Drinks Warehouse") {
  const fromAddress =
    process.env.SMTP_FROM ||
    process.env.EMAIL_FROM ||
    process.env.SMTP_USER ||
    process.env.EMAIL_USER;

  return fromAddress ? `${defaultLabel} <${fromAddress}>` : defaultLabel;
}

export function maskEmailAddress(email) {
  if (typeof email !== "string" || !email.includes("@")) {
    return "your email";
  }

  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) {
    return email;
  }

  if (localPart.length <= 2) {
    return `${localPart[0] || "*"}*@${domain}`;
  }

  return `${localPart[0]}${"*".repeat(Math.max(1, localPart.length - 2))}${localPart.at(-1)}@${domain}`;
}