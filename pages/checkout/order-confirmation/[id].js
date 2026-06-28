import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import Head from "next/head";
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import Header from "@/components/Header";
import Center from "@/components/Center";
import { getPrimaryProductImage } from "@/lib/productImages";
import { CartContext } from "@/components/CartContext";
import {
  getPublicSiteConfig,
  getPublicScopedHref,
  inferPublicSiteFromPath,
  normalizePublicSite,
} from "@/lib/publicSite";

const MANUAL_PAYMENT_CHANNELS = new Set(["manual-entry", "manual", "pos"]);

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
  });
}

function resolvePaymentStatusLabel(order) {
  if (order?.paid || order?.paymentStatus === "Paid") {
    return "Paid";
  }

  if (MANUAL_PAYMENT_CHANNELS.has(String(order?.paymentChannel || "").trim().toLowerCase())) {
    return "Awaiting confirmation";
  }

  return order?.paymentStatus || "Pending";
}

export default function OrderConfirmationPage() {
  const router = useRouter();
  const siteKey = normalizePublicSite(inferPublicSiteFromPath(router.pathname));
  const site = getPublicSiteConfig(siteKey);
  const { id } = router.query;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const { clearCart } = useContext(CartContext);

  useEffect(() => {
    if (!router.isReady || !id) {
      return;
    }

    let cancelled = false;

    axios
      .get("/api/orders", {
        params: { id },
      })
      .then((response) => {
        if (cancelled) {
          return;
        }

        setOrder(response.data);
        clearCart();
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(
            error.response?.data?.message ||
              "We could not load this order right now."
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [clearCart, id, router.isReady]);

  if (loading) {
    return (
      <>
        <Head>
          <title>{`Loading Order | ${site.displayName}`}</title>
        </Head>
        <Header siteKey={siteKey} />
        <Center>
          <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-10">
            <div className="theme-shell-light mx-auto max-w-xl rounded-[2rem] px-6 py-10 text-center shadow-[0_30px_70px_rgba(18,52,60,0.08)]">
              <h1 className="text-2xl font-bold text-[var(--foreground-strong)]">Loading your order</h1>
              <p className="mt-3 theme-muted-page">We are retrieving the final order details and invoice summary.</p>
              <Link
                href={getPublicScopedHref(siteKey, "/")}
                className="theme-card-light mt-6 inline-flex min-h-[3rem] items-center justify-center rounded-[1rem] px-5 py-3 text-sm font-semibold text-[var(--foreground-strong)] shadow-sm"
              >
                Return to home
              </Link>
            </div>
          </div>
        </Center>
      </>
    );
  }

  if (loadError && !order) {
    return (
      <>
        <Head>
          <title>{`Order Pending | ${site.displayName}`}</title>
        </Head>
        <Header siteKey={siteKey} />
        <Center>
          <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-10">
            <div className="max-w-xl rounded-2xl border border-amber-200 bg-amber-50 px-6 py-8 text-center shadow-sm">
              <h1 className="text-2xl font-bold text-amber-900">Order update pending</h1>
              <p className="mt-3 text-amber-800">{loadError}</p>
              <p className="mt-3 text-sm text-amber-700">
                If you just placed the order, refresh shortly. We may still be updating the latest details.
              </p>
              <Link
                href={getPublicScopedHref(siteKey, "/")}
                className="mt-6 inline-flex min-h-[3rem] items-center justify-center rounded-[1rem] border border-amber-200 bg-white px-5 py-3 text-sm font-semibold text-amber-900 shadow-sm"
              >
                Go to home
              </Link>
            </div>
          </div>
        </Center>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Head>
          <title>{`Order Not Found | ${site.displayName}`}</title>
        </Head>
        <Header siteKey={siteKey} />
        <Center>
          <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-10">
            <div className="theme-shell-light mx-auto max-w-xl rounded-[2rem] px-6 py-10 text-center">
              <h1 className="text-2xl font-bold text-[var(--foreground-strong)]">Order not found</h1>
              <p className="mt-3 theme-muted-page">We could not locate that order record. Return to the storefront and try again from your recent orders.</p>
              <Link
                href={getPublicScopedHref(siteKey, "/")}
                className="theme-button-primary mt-6 inline-flex min-h-[3rem] items-center justify-center rounded-[1rem] px-5 py-3 text-sm font-semibold"
              >
                Go to home
              </Link>
            </div>
          </div>
        </Center>
      </>
    );
  }

  const subtotal = Number(order.subtotal || 0);
  const shippingCost = Number(order.shippingCost || 0);
  const totalAmount = Number(order.total || subtotal + shippingCost);
  const orderDate = new Date(order.createdAt).toLocaleString();
  const itemCount = order.items?.length || 0;
  const paymentStatusLabel = resolvePaymentStatusLabel(order);
  const customerDetails = order.shippingDetails || order.customerSnapshot || order.customer || {};

  return (
    <>
      <Head>
        <title>{`Order Confirmation | ${site.displayName}`}</title>
      </Head>
      <Header siteKey={siteKey} />
      <Center>
        <div className="theme-shell-light mx-auto my-16 max-w-4xl rounded-2xl px-6 py-10">
          <div className="flex justify-center mb-8">
            <Image
              src="/images/st-micheals-logo.png"
              alt="St Michael's Logo"
              width={80}
              height={80}
              className="size-20"
            />
          </div>

          <h1 className="mb-4 text-center text-3xl font-bold text-[var(--foreground-strong)] md:text-4xl">
            Your order has been received
          </h1>
          <p className="mx-auto mb-4 max-w-2xl text-center text-lg theme-muted-page">
            Order <strong>#{order._id}</strong> was recorded on <em>{orderDate}</em>. We have sent your confirmation email, and the team will contact you if any follow-up is needed.
          </p>
          <p className="mb-8 text-center text-sm theme-muted-page">
            Your delivery fee and final total are shown below.
          </p>

          <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
            <span className={`rounded-full px-4 py-2 text-sm font-semibold ${
              order.paid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
            }`}>
              Payment: {paymentStatusLabel}
            </span>
            <span className="theme-card-light rounded-full px-4 py-2 text-sm font-semibold text-[var(--foreground-strong)]">
              Status: {order.status}
            </span>
            {order.locationName && (
              <span className="theme-card-light rounded-full px-4 py-2 text-sm font-semibold text-[var(--foreground-strong)]">
                Location: {order.locationName}
              </span>
            )}
          </div>

          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <div className="theme-card-light rounded-[1.5rem] px-5 py-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-[rgba(18,52,60,0.52)]">Payment status</p>
              <p className="mt-2 text-3xl font-bold text-[var(--foreground-strong)]">{paymentStatusLabel}</p>
            </div>
            <div className="theme-card-light rounded-[1.5rem] px-5 py-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-[rgba(18,52,60,0.52)]">Order status</p>
              <p className="mt-2 text-3xl font-bold text-[var(--foreground-strong)]">{order.status}</p>
            </div>
            <div className="theme-card-light rounded-[1.5rem] px-5 py-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-[rgba(18,52,60,0.52)]">Items in order</p>
              <p className="mt-2 text-3xl font-bold text-[var(--foreground-strong)]">{itemCount}</p>
            </div>
          </div>

          <section className="theme-card-light space-y-4 rounded-[1.5rem] p-6 shadow-sm">
            <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
              <div>
                <h2 className="border-b border-[rgba(20,109,126,0.12)] pb-2 text-xl font-semibold text-[var(--foreground-strong)]">
                  Customer details
                </h2>
                <div className="mt-4 grid gap-3 text-sm theme-muted-page">
                  <p><span className="font-medium text-[var(--foreground-strong)]">Name:</span> {customerDetails.name || "N/A"}</p>
                  <p><span className="font-medium text-[var(--foreground-strong)]">Email:</span> {customerDetails.email || "N/A"}</p>
                  <p><span className="font-medium text-[var(--foreground-strong)]">Phone:</span> {customerDetails.phone || "N/A"}</p>
                  <p>
                    <span className="font-medium text-[var(--foreground-strong)]">Address:</span>{" "}
                    {customerDetails.address || "N/A"}
                    {customerDetails.city ? `, ${customerDetails.city}` : ""}
                  </p>
                </div>

                <div className="mt-6 rounded-[1.25rem] border border-[rgba(20,109,126,0.12)] bg-[rgba(247,243,236,0.86)] px-4 py-4 text-sm leading-7 text-[rgba(18,52,60,0.78)]">
                  Keep your email and phone available in case the team needs to reach you about your order.
                </div>
              </div>

              <div>
                <h2 className="border-b border-[rgba(20,109,126,0.12)] pb-2 text-xl font-semibold text-[var(--foreground-strong)]">
                  Items in your order
                </h2>

                {order.items && order.items.length > 0 ? (
                  <ul className="mt-4 space-y-4">
                    {order.items.map(({ _id, quantity, price, productId, name }) => {
                      const itemName = productId?.name || name || "Unnamed Product";
                      const unitPrice = Number(price ?? productId?.salePriceIncTax ?? 0);
                      const lineTotal = unitPrice * Number(quantity || 0);
                      const image = getPrimaryProductImage(productId?.images);

                      return (
                        <li
                          key={_id || `${itemName}-${quantity}`}
                          className="flex flex-col justify-between gap-4 rounded-[1.25rem] border border-[rgba(20,109,126,0.12)] bg-white/75 p-4 md:flex-row md:items-center"
                        >
                          <div className="flex gap-4">
                            <Image
                              src={image}
                              alt={itemName}
                              width={64}
                              height={64}
                              className="h-16 w-16 rounded border border-[rgba(20,109,126,0.12)] object-cover"
                            />
                            <div>
                              <p className="text-lg font-medium text-[var(--foreground-strong)]">{itemName}</p>
                              <p className="text-sm theme-muted-page">
                                {quantity} × ₦{unitPrice.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right font-bold text-[var(--foreground-strong)]">
                            ₦{lineTotal.toLocaleString()}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm theme-muted-page">No items found in this order.</p>
                )}

                <div className="mt-6 space-y-3 border-t border-[rgba(20,109,126,0.12)] pt-4">
                  <div className="flex items-center justify-between text-sm theme-muted-page">
                    <span>Items subtotal</span>
                    <strong className="text-[var(--foreground-strong)]">{formatCurrency(subtotal)}</strong>
                  </div>
                  <div className="flex items-center justify-between text-sm theme-muted-page">
                    <span>Delivery fee</span>
                    <strong className="text-[var(--foreground-strong)]">{formatCurrency(shippingCost)}</strong>
                  </div>
                  <div className="flex items-center justify-between text-lg font-bold text-[var(--foreground-strong)]">
                    <span>Total</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={getPublicScopedHref(order.siteKey || siteKey, "/")}
              className="theme-button-primary inline-block rounded-md px-6 py-3 text-lg font-semibold transition-all duration-200"
            >
              Continue shopping
            </Link>
            <Link
              href={getPublicScopedHref(order.siteKey || siteKey, "/account")}
              className="theme-card-light inline-block rounded-md px-6 py-3 text-lg font-semibold text-[var(--foreground-strong)] shadow-sm"
            >
              View my orders
            </Link>
          </div>
        </div>
      </Center>
    </>
  );
}

OrderConfirmationPage.hideFooter = true;
