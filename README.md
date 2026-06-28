## St Michael's Food & Drinks Warehouse

This repository contains the storefront for St Michael's Food & Drinks Warehouse, built with Next.js pages router, MongoDB/Mongoose, Paystack checkout, and OTP-based customer account access.

## Local Setup

1. Install dependencies.

```bash
npm install
```

2. Create a local environment file from [.env.example](.env.example).

3. Fill in the required values for MongoDB, Paystack, and mail delivery.

4. Start the development server.

```bash
npm run dev
```

5. Open `http://localhost:3000`.

## Environment Variables

The app reads its runtime configuration from `.env`.

Required for core storefront flows:

- `MONGODB_URI`: primary MongoDB connection string. In production this should remain the cloud Atlas URI.
- `CUSTOMER_SESSION_SECRET`: secret used to sign the customer session cookie.
- `PAYSTACK_SECRET_KEY`: Paystack secret key for payment initialization, verification, and webhook validation.
- `NEXT_PUBLIC_SITE_URL`: public base URL used when building payment callback URLs.
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`: Paystack public key used on the client.

Optional but recommended for local development:

- `MONGODB_DIRECT_URI`: direct Atlas replica-set connection string. Use this if your local network can reach Atlas hosts directly but fails SRV lookups for `mongodb+srv` URIs.
- `MONGODB_LOCAL_URI` or `LOCAL_MONGODB_URI`: local MongoDB fallback if you want to run the app against a local database.
- `FEATURED_PRODUCT_ID`: forces a specific product into the homepage featured slot.

Mail delivery options:

- Preferred SMTP settings: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.
- Legacy Gmail fallback: `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`.

## MongoDB Fallback Note

The storefront is cloud-first. In production, the app uses `MONGODB_URI` as the primary source of truth.

For local development, [lib/mongoose.js](lib/mongoose.js) now prefers `MONGODB_DIRECT_URI` when it is present. This is intentional: some local networks can open direct Atlas hostnames but fail DNS SRV resolution for `mongodb+srv` records. When that happens, a direct Atlas URI keeps the app connected to the same live cluster without switching to seeded-only preview mode.

If your machine can resolve SRV records normally, `MONGODB_DIRECT_URI` is optional.

## Useful Commands

```bash
npm run dev
npm run lint
npm run build
npm run test:integration
```

## Notes

- The storefront includes seeded catalog fallback behavior for preview resilience when MongoDB is unavailable.
- Customer account sign-in uses email OTP. In development, if mail delivery is not configured, the API can return a console-delivered debug OTP instead of pretending email was sent.
- Order confirmation reads through the stable `/api/orders?id=<orderId>` lookup path.
# StMichaelshubSite
# StMichaelshubSite
