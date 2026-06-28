// pages/api/initiate-paystack.js

import axios from 'axios';
import { mongooseConnect } from "@/lib/mongoose";
import Order from "@/models/Order";
import { releaseExpiredReservations } from "@/lib/orderLifecycle";
import { getPublicOrderConfirmationPath } from "@/lib/publicSite";

function getSiteUrl(req) {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] || (host?.includes("localhost") ? "http" : "https");

  return host ? `${protocol}://${host}` : "";
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!secretKey) {
    return res.status(500).json({ error: "PAYSTACK_SECRET_KEY is not configured" });
  }

  await mongooseConnect();

  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: "Order ID is required" });
  }

  try {
    await releaseExpiredReservations();

    const order = await Order.findById(orderId).populate("customer");
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.paid) {
      return res.status(400).json({ error: "This order has already been paid for" });
    }

    if (!order.customer?.email) {
      return res.status(400).json({ error: "Order customer details are incomplete" });
    }

    if (order.reservationStatus !== "active") {
      return res.status(409).json({
        error: "This reservation is no longer active. Please rebuild your cart and try again.",
      });
    }

    const siteUrl = getSiteUrl(req);
    const amount = Math.round((order.total || 0) * 100);
    if (amount <= 0) {
      return res.status(400).json({ error: "Order total must be greater than zero" });
    }

    const paystackRes = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: order.customer.email,
        amount,
        callback_url: `${siteUrl}${getPublicOrderConfirmationPath(order.siteKey, orderId)}`,
        metadata: {
          orderId: String(order._id),
          siteKey: order.siteKey,
          reservationExpiresAt: order.reservationExpiresAt,
          customer: {
            name: order.customer.name,
            email: order.customer.email,
            phone: order.customer.phone,
          },
          custom_fields: [
            {
              display_name: 'Customer Name',
              variable_name: 'customer_name',
              value: order.customer.name,
            },
            {
              display_name: 'Customer Phone',
              variable_name: 'customer_phone',
              value: order.customer.phone,
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const { authorization_url: authorizationUrl } = paystackRes.data.data;

    res.status(200).json({ authorizationUrl, orderId: order._id });
  } catch (error) {
    console.error('Paystack Init Error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Failed to initiate Paystack payment.' });
  }
}
