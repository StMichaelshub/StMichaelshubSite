import { useContext, useEffect, useState } from "react";
import Image from "next/image";
import { CartContext } from "@/components/CartContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import Header from "@/components/Header";
import Link from "next/link";
import Head from "next/head";
import Center from "@/components/Center";
import axios from "axios";
import { getPrimaryProductImage } from "@/lib/productImages";
import { SUPPORTED_SHIPPING_DESTINATIONS } from "@/lib/shipping";
import { getAvailableInventoryQuantity } from "@/lib/inventory";
import { useRouter } from "next/router";
import {
  getPublicSiteConfig,
  getPublicScopedHref,
  inferPublicSiteFromPath,
  normalizePublicSite,
} from "@/lib/publicSite";

export default function CartPage() {
  const router = useRouter();
  const siteKey = normalizePublicSite(inferPublicSiteFromPath(router.pathname));
  const site = getPublicSiteConfig(siteKey);
  const isHotelSite = siteKey === "hotel";
  const { cartProducts, removeProductFromCart, updateProductQuantity } = useContext(CartContext);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [pricingPreview, setPricingPreview] = useState(null);
  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: SUPPORTED_SHIPPING_DESTINATIONS[0] || "",
  });

  useEffect(() => {
    axios
      .get("/api/account/session")
      .then((response) => {
        if (!response.data?.authenticated) {
          return;
        }

        const accountCustomer = response.data.customer;
        setCustomer((currentValue) => ({
          ...currentValue,
          name: currentValue.name || accountCustomer.name || "",
          email: currentValue.email || accountCustomer.email || "",
          phone: currentValue.phone || accountCustomer.phone || "",
          address: currentValue.address || accountCustomer.address || "",
          city: currentValue.city || accountCustomer.city || currentValue.city,
        }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!customer.city) {
      return;
    }

    if (cartProducts.length === 0) {
      return;
    }

    let cancelled = false;
    const previewCartProducts = cartProducts.map((item) => ({
      _id: item.id,
      quantity: item.qty || 1,
    }));

    axios
      .post("/api/shipping-cost", {
        destination: customer.city,
        cartProducts: previewCartProducts,
        siteKey,
      })
      .then((res) => {
        if (!cancelled) {
          setPricingPreview(res.data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPricingPreview(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [cartProducts, customer.city, siteKey]);

  useEffect(() => {
    const ids = cartProducts.map((p) => p.id);
    if (ids.length > 0) {
      let cancelled = false;

      axios.post("/api/cart", { ids, siteKey }).then((res) => {
        if (!cancelled) {
          setProducts(res.data.products);
        }
      });

      return () => {
        cancelled = true;
      };
    }
  }, [cartProducts, siteKey]);

  const displayedProducts = cartProducts.length > 0 ? products : [];
  const cartLines = displayedProducts.map((product) => {
    const cartItem = cartProducts.find((item) => item.id === product._id);
    const quantity = cartItem?.qty || 1;
    const availableQuantity = getAvailableInventoryQuantity(product);

    return {
      product,
      quantity,
      imageSrc: getPrimaryProductImage(product?.images),
      availableQuantity,
      isSoldOut: availableQuantity === 0,
      exceedsStock: availableQuantity > 0 && quantity > availableQuantity,
    };
  });
  const subtotal = cartLines.reduce(
    (sum, line) => sum + (line.product.salePriceIncTax || 0) * line.quantity,
    0
  );
  const activePricingPreview = customer.city && cartProducts.length > 0 ? pricingPreview : null;
  const pricingTotals = activePricingPreview?.totals || null;
  const baseSubtotal = pricingTotals?.baseSubtotal ?? subtotal;
  const discountTotal = pricingTotals?.discountTotal ?? 0;
  const shippingCost = !customer.city || cartProducts.length === 0 ? 0 : pricingTotals?.shippingCost ?? 0;
  const totalAmount = pricingTotals?.total ?? subtotal + shippingCost;
  const quoteDestination = activePricingPreview?.shippingQuote?.destination || customer.city;
  const quoteMessage = activePricingPreview
    ? `Delivery fee for ${quoteDestination}: ₦${shippingCost.toLocaleString()}${discountTotal > 0 ? ". Savings are already included." : "."}`
    : customer.city && cartProducts.length > 0
      ? "Updating the delivery fee for this address."
      : "";
  const summaryItems = [
    { label: "Items subtotal", value: `₦${baseSubtotal.toLocaleString()}` },
    ...(discountTotal > 0
      ? [{ label: "Campaign adjustment", value: `-₦${discountTotal.toLocaleString()}` }]
      : []),
    { label: "Delivery fee", value: `₦${shippingCost.toLocaleString()}` },
  ];
  const totalItems = cartProducts.reduce((sum, item) => sum + item.qty, 0);
  const hasInventoryIssues = cartLines.some((line) => line.isSoldOut || line.exceedsStock);
  const inventoryAlertText = cartLines
    .filter((line) => line.isSoldOut || line.exceedsStock)
    .map((line) =>
      line.isSoldOut
        ? `${line.product.name} is currently unavailable.`
        : `${line.product.name} exceeds available stock. Reduce to ${line.availableQuantity}.`
    )
    .join(" ");
  const storeInputClassName = "mt-1 w-full rounded-[1rem] border border-[rgba(31,44,51,0.12)] bg-white/86 px-4 py-3 text-sm text-[var(--foreground-strong)] outline-none transition focus:border-[rgba(176,114,42,0.38)] focus:ring-4 focus:ring-[rgba(176,114,42,0.1)]";

  const handleQuantityChange = (productId, nextQuantity, availableQuantity) => {
    if (availableQuantity === 0) {
      return;
    }

    const clampedQuantity = Math.max(1, Math.min(nextQuantity, availableQuantity));
    updateProductQuantity(productId, clampedQuantity, { maxQuantity: availableQuantity });
  };

  const handleCheckout = async () => {
    setCheckoutError("");

    const requiredFields = ["name", "email", "phone", "address", "city"];
    const missing = requiredFields.find((field) => !customer[field]);
    if (missing) {
      setCheckoutError(`Please enter your ${missing}.`);
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customer.email)) {
      setCheckoutError("Please enter a valid email address.");
      return;
    }

    // Validate phone
    const phoneDigits = customer.phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      setCheckoutError("Please enter a valid phone number with at least 10 digits.");
      return;
    }

    setIsLoading(true);
    const fullCartProducts = displayedProducts.map((product) => ({
      _id: product._id,
      quantity: cartProducts.find((item) => item.id === product._id)?.qty || 1,
    }));

    try {
      const orderRes = await axios.post("/api/orders", {
        customer,
        cartProducts: fullCartProducts,
        siteKey,
      });

      const { orderId } = orderRes.data;

      if (!orderRes.data.success) {
        setCheckoutError("Failed to save your order.");
        setIsLoading(false);
        return;
      }

      router.push(getPublicScopedHref(siteKey, `/checkout/order-confirmation/${orderId}`));
    } catch (error) {
      setCheckoutError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isHotelSite) {
    return (
      <>
        <Head>
          <title>{`Your Cart | ${site.displayName}`}</title>
        </Head>

        <Header siteKey={siteKey} />
        <Center>
          <div className="min-h-screen px-3 py-6 sm:px-8 sm:py-8">
            <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-5 xl:grid-cols-[1.18fr_0.82fr] xl:gap-6">
              <div className="store-shell rounded-[2rem] p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col gap-4 border-b border-[rgba(31,44,51,0.08)] pb-6 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <span className="store-tag inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em]">
                      Checkout readiness
                    </span>
                    <h1 className="mt-4 text-3xl font-extrabold text-[var(--foreground-strong)] sm:text-[2.4rem]">
                      Cart and delivery review
                    </h1>
                    <p className="mt-3 max-w-2xl text-base leading-8 store-shell-muted">
                      Review your items, confirm your delivery details, and place your order.
                    </p>
                  </div>
                  <div className="store-button-secondary inline-flex min-h-[3rem] items-center rounded-[1rem] px-4 py-3 text-sm font-semibold">
                    {cartLines.length} line{cartLines.length === 1 ? "" : "s"} · {totalItems} item{totalItems === 1 ? "" : "s"}
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      label: "1. Review basket",
                      detail: "Check your quantities before placing the order.",
                    },
                    {
                      label: "2. Confirm delivery",
                      detail: "Delivery fees update for your address.",
                    },
                    {
                      label: "3. Place order",
                      detail: "Place your order and receive confirmation by email.",
                    },
                  ].map((step) => (
                    <div key={step.label} className="store-shell-card rounded-[1.35rem] px-4 py-4">
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[rgba(18,52,60,0.48)]">
                        {step.label}
                      </p>
                      <p className="mt-2 text-sm leading-7 store-shell-muted">{step.detail}</p>
                    </div>
                  ))}
                </div>

                {displayedProducts.length === 0 ? (
                  <div className="mt-8 rounded-[1.6rem] border border-dashed border-[rgba(31,44,51,0.18)] bg-[rgba(255,255,255,0.62)] px-6 py-14 text-center">
                    <p className="text-lg store-shell-muted">Your cart is currently empty.</p>
                    <Link
                      href={getPublicScopedHref(siteKey, "/")}
                      className="store-button-accent mt-6 inline-flex min-h-[3.2rem] items-center justify-center rounded-[1rem] px-6 py-3 text-sm font-semibold"
                    >
                      Continue shopping
                    </Link>
                  </div>
                ) : (
                  <>
                    {hasInventoryIssues && (
                      <div className="mt-6 rounded-[1.4rem] border border-amber-200/80 bg-amber-50 px-5 py-4 text-sm text-amber-800">
                        Resolve stock alerts before you continue. {inventoryAlertText}
                      </div>
                    )}

                    <div className="mt-6 space-y-4 sm:hidden">
                      {cartLines.map((line) => (
                        <div key={line.product._id} className="store-shell-card rounded-[1.4rem] p-4">
                          <div className="flex items-start gap-3">
                            <Image
                              src={line.imageSrc}
                              alt={line.product.name || "Product"}
                              width={72}
                              height={72}
                              className="h-[4.5rem] w-[4.5rem] rounded-[1rem] border border-[rgba(31,44,51,0.08)] bg-[rgba(247,243,236,0.86)] object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <h2 className="line-clamp-2 text-sm font-semibold text-[var(--foreground-strong)]">
                                    {line.product.name}
                                  </h2>
                                  <p className="mt-1 text-sm text-[rgba(18,52,60,0.72)]">
                                    ₦{(line.product.salePriceIncTax || 0).toLocaleString()} each
                                  </p>
                                </div>
                                <button
                                  onClick={() => removeProductFromCart(line.product._id)}
                                  className="text-lg text-rose-600 transition hover:text-rose-700"
                                  aria-label="Remove item"
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              </div>

                              <p
                                className={`mt-2 text-xs leading-6 ${
                                  line.isSoldOut
                                    ? "text-rose-600"
                                    : line.exceedsStock
                                      ? "text-amber-700"
                                      : "store-shell-muted"
                                }`}
                              >
                                {line.isSoldOut
                                  ? "Currently unavailable. Remove before checkout."
                                  : line.exceedsStock
                                    ? `Reduce quantity to ${line.availableQuantity} to continue.`
                                    : `${line.availableQuantity} available for this delivery window`}
                              </p>

                              <div className="mt-4 flex items-end justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() =>
                                      handleQuantityChange(
                                        line.product._id,
                                        line.quantity - 1,
                                        line.availableQuantity
                                      )
                                    }
                                    aria-label="Decrease quantity"
                                    disabled={line.quantity <= 1 || line.isSoldOut}
                                    className="store-button-secondary inline-flex h-9 w-9 items-center justify-center rounded-xl text-lg font-bold disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    −
                                  </button>
                                  <span className="min-w-[2rem] text-center text-sm font-semibold text-[var(--foreground-strong)]">
                                    {line.quantity}
                                  </span>
                                  <button
                                    onClick={() =>
                                      handleQuantityChange(
                                        line.product._id,
                                        line.quantity + 1,
                                        line.availableQuantity
                                      )
                                    }
                                    aria-label="Increase quantity"
                                    disabled={line.isSoldOut || line.quantity >= line.availableQuantity}
                                    className="store-button-secondary inline-flex h-9 w-9 items-center justify-center rounded-xl text-lg font-bold disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    +
                                  </button>
                                </div>

                                <div className="text-right">
                                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[rgba(18,52,60,0.46)]">
                                    Line total
                                  </p>
                                  <p className="mt-1 text-sm font-semibold text-[var(--foreground-strong)]">
                                    ₦{((line.product.salePriceIncTax || 0) * line.quantity).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 hidden overflow-x-auto sm:block">
                      <div className="overflow-hidden rounded-[1.6rem] border border-[rgba(31,44,51,0.08)] bg-[rgba(255,255,255,0.78)]">
                        <table className="min-w-full text-left text-sm text-[var(--foreground)]">
                          <thead>
                            <tr className="bg-[rgba(247,243,236,0.96)] text-xs uppercase tracking-[0.22em] text-[rgba(18,52,60,0.56)]">
                              <th className="px-4 py-4">Product</th>
                              <th className="px-4 py-4 text-center">Quantity</th>
                              <th className="px-4 py-4 text-center">Line total</th>
                              <th className="px-4 py-4 text-right">Remove</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[rgba(31,44,51,0.08)]">
                            {cartLines.map((line, index) => (
                              <tr
                                key={line.product._id}
                                className={index % 2 === 0 ? "bg-white/84" : "bg-[rgba(249,246,240,0.82)]"}
                              >
                                <td className="px-4 py-4">
                                  <div className="flex items-start gap-4">
                                    <Image
                                      src={line.imageSrc}
                                      alt={line.product.name || "Product"}
                                      width={56}
                                      height={56}
                                      className="rounded-[0.95rem] border border-[rgba(31,44,51,0.08)] bg-[rgba(247,243,236,0.86)] object-cover"
                                    />
                                    <div>
                                      <h2 className="text-sm font-semibold text-[var(--foreground-strong)] sm:text-base">
                                        {line.product.name}
                                      </h2>
                                      <p className="mt-1 text-sm text-[rgba(18,52,60,0.72)]">
                                        ₦{(line.product.salePriceIncTax || 0).toLocaleString()} each
                                      </p>
                                      <p
                                        className={`mt-2 text-xs leading-6 ${
                                          line.isSoldOut
                                            ? "text-rose-600"
                                            : line.exceedsStock
                                              ? "text-amber-700"
                                              : "store-shell-muted"
                                        }`}
                                      >
                                        {line.isSoldOut
                                          ? "Currently unavailable. Remove before checkout."
                                          : line.exceedsStock
                                            ? `Reduce quantity to ${line.availableQuantity} to continue.`
                                            : `${line.availableQuantity} available for this delivery window`}
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                <td className="px-4 py-4 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() =>
                                        handleQuantityChange(
                                          line.product._id,
                                          line.quantity - 1,
                                          line.availableQuantity
                                        )
                                      }
                                      aria-label="Decrease quantity"
                                      disabled={line.quantity <= 1 || line.isSoldOut}
                                      className="store-button-secondary h-9 w-9 rounded-xl text-lg font-bold disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      −
                                    </button>
                                    <span className="min-w-[2rem] text-center text-sm font-semibold sm:text-base">
                                      {line.quantity}
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleQuantityChange(
                                          line.product._id,
                                          line.quantity + 1,
                                          line.availableQuantity
                                        )
                                      }
                                      aria-label="Increase quantity"
                                      disabled={line.isSoldOut || line.quantity >= line.availableQuantity}
                                      className="store-button-secondary h-9 w-9 rounded-xl text-lg font-bold disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      +
                                    </button>
                                  </div>
                                </td>

                                <td className="px-4 py-4 text-center text-sm font-semibold text-[var(--foreground-strong)] sm:text-base">
                                  ₦{((line.product.salePriceIncTax || 0) * line.quantity).toLocaleString()}
                                </td>

                                <td className="px-4 py-4 text-right">
                                  <button
                                    onClick={() => removeProductFromCart(line.product._id)}
                                    className="text-lg text-rose-600 transition hover:text-rose-700 sm:text-xl"
                                    aria-label="Remove item"
                                  >
                                    <FontAwesomeIcon icon={faTrash} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-4 rounded-[1.5rem] border border-[rgba(31,44,51,0.08)] bg-[rgba(255,255,255,0.7)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[rgba(18,52,60,0.48)]">Subtotal</p>
                        <p className="mt-2 text-2xl font-bold text-[var(--foreground-strong)]">₦{subtotal.toLocaleString()}</p>
                      </div>
                      <Link
                        href={getPublicScopedHref(siteKey, "/")}
                        className="store-button-secondary inline-flex min-h-[3rem] items-center justify-center rounded-[1rem] px-5 py-3 text-sm font-semibold"
                      >
                        Continue shopping
                      </Link>
                    </div>
                  </>
                )}
              </div>

              <aside className="store-shell rounded-[2rem] p-5 sm:p-6 lg:p-7">
                <h2 className="text-2xl font-bold text-[var(--foreground-strong)]">Order summary</h2>
                <p className="mt-2 text-sm leading-7 store-shell-muted">
                  Delivery fees and any savings are shown below so you can review the final total before placing your order.
                </p>

                <div className="mt-5 space-y-3">
                  {[
                    { label: "Items", value: totalItems },
                    ...summaryItems,
                  ].map((item) => (
                    <div key={item.label} className="store-shell-card flex items-center justify-between rounded-[1.2rem] px-4 py-4 text-sm">
                      <span className="store-shell-muted">{item.label}</span>
                      <span className="font-semibold text-[var(--foreground-strong)]">{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-[1.4rem] border border-[rgba(31,44,51,0.08)] bg-[rgba(31,44,51,0.04)] px-4 py-4">
                  <div className="flex items-center justify-between gap-3 text-[var(--foreground-strong)]">
                    <span className="text-sm font-semibold uppercase tracking-[0.18em]">Total</span>
                    <span className="text-2xl font-bold">₦{totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                {quoteMessage && (
                  <div className="mt-4 rounded-[1.35rem] border border-[rgba(31,44,51,0.08)] bg-[rgba(247,243,236,0.86)] px-4 py-4 text-sm leading-7 text-[rgba(18,52,60,0.78)]">
                    {quoteMessage}
                  </div>
                )}

                <div className="mt-6 rounded-[1.5rem] border border-[rgba(31,44,51,0.08)] bg-[rgba(255,255,255,0.6)] p-4 sm:p-5">
                  <h3 className="text-lg font-semibold text-[var(--foreground-strong)]">Customer information</h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="text-sm font-medium text-[rgba(18,52,60,0.72)] sm:col-span-2">
                      Full name
                      <input
                        type="text"
                        placeholder="Full Name"
                        className={storeInputClassName}
                        value={customer.name}
                        onChange={(e) =>
                          setCustomer({ ...customer, name: e.target.value })
                        }
                      />
                    </label>
                    <label className="text-sm font-medium text-[rgba(18,52,60,0.72)]">
                      Email address
                      <input
                        type="email"
                        placeholder="Email Address"
                        className={storeInputClassName}
                        value={customer.email}
                        onChange={(e) =>
                          setCustomer({ ...customer, email: e.target.value })
                        }
                      />
                    </label>
                    <label className="text-sm font-medium text-[rgba(18,52,60,0.72)]">
                      Phone number
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        className={storeInputClassName}
                        value={customer.phone}
                        onChange={(e) =>
                          setCustomer({ ...customer, phone: e.target.value })
                        }
                      />
                    </label>
                    <label className="text-sm font-medium text-[rgba(18,52,60,0.72)] sm:col-span-2">
                      Street address
                      <input
                        type="text"
                        placeholder="Street Address"
                        className={storeInputClassName}
                        value={customer.address}
                        onChange={(e) =>
                          setCustomer({ ...customer, address: e.target.value })
                        }
                      />
                    </label>
                    <label className="text-sm font-medium text-[rgba(18,52,60,0.72)] sm:col-span-2">
                      Delivery city
                      <select
                        className={storeInputClassName}
                        value={customer.city}
                        onChange={(e) => {
                          setPricingPreview(null);
                          setCustomer({ ...customer, city: e.target.value });
                        }}
                      >
                        {SUPPORTED_SHIPPING_DESTINATIONS.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                {checkoutError && (
                  <div className="mt-4 rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {checkoutError}
                  </div>
                )}

                <div className="mt-4 rounded-[1.35rem] border border-[rgba(31,44,51,0.08)] bg-[rgba(247,243,236,0.86)] px-4 py-4 text-sm leading-7 text-[rgba(18,52,60,0.78)]">
                  Prices and delivery fees are confirmed before your order is placed. Signed-in customers can also use their saved details automatically.
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isLoading || displayedProducts.length === 0 || hasInventoryIssues}
                  className={`mt-5 w-full min-h-[3.4rem] rounded-[1rem] py-3 text-sm font-semibold transition ${
                    isLoading || displayedProducts.length === 0 || hasInventoryIssues
                      ? "bg-[rgba(18,52,60,0.08)] text-[rgba(18,52,60,0.42)] cursor-not-allowed"
                      : "store-button-accent"
                  }`}
                >
                  {isLoading
                    ? "Processing..."
                    : hasInventoryIssues
                      ? "Resolve stock alerts to continue"
                      : "Place order"}
                </button>
              </aside>
            </div>
          </div>
        </Center>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{`Your Cart | ${site.displayName}`}</title>
      </Head>

      <Header siteKey={siteKey} />
      <Center>
        <div className="min-h-screen px-3 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-5 md:grid-cols-3 md:gap-8">
            {/* Cart Items */}
            <div className="theme-shell-light rounded-[1.75rem] p-4 sm:rounded-2xl sm:p-8 md:col-span-2">
              <h1 className="mb-6 border-b border-[rgba(20,109,126,0.12)] pb-4 text-2xl font-extrabold text-[var(--foreground-strong)] sm:text-3xl">
                Shopping Cart
              </h1>

              <div className="mb-8 grid gap-4 sm:grid-cols-3">
                {[
                  {
                    label: "1. Review basket",
                    detail: "Check your quantities before placing the order.",
                  },
                  {
                    label: "2. Confirm delivery",
                    detail: "Delivery fees update for your address.",
                  },
                  {
                    label: "3. Place order",
                    detail: "Place your order and receive confirmation by email.",
                  },
                ].map((step) => (
                  <div key={step.label} className="theme-card-light rounded-[1.5rem] px-4 py-4 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.22em] text-[rgba(18,52,60,0.52)]">{step.label}</p>
                    <p className="mt-2 text-sm leading-7 theme-muted-page">{step.detail}</p>
                  </div>
                ))}
              </div>

              {displayedProducts.length === 0 ? (
                <div className="text-center py-16">
                  <p className="mb-6 text-lg theme-muted-page">
                    Your cart is currently empty.
                  </p>
                  <Link
                    href={getPublicScopedHref(siteKey, "/")}
                    className="theme-button-accent inline-block px-6 py-3 rounded-lg transition"
                  >
                    Continue Shopping
                  </Link>
                </div>
              ) : (
                <>
                  {hasInventoryIssues && (
                    <div className="mb-6 rounded-[1.5rem] border border-amber-200/80 bg-amber-50 px-5 py-4 text-sm text-amber-800">
                      Resolve stock alerts before you continue. {inventoryAlertText}
                    </div>
                  )}

                  <div className="mb-6 space-y-4 sm:hidden">
                    {cartLines.map((line) => (
                      <div key={line.product._id} className="theme-card-light rounded-[1.35rem] p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                          <Image
                            src={line.imageSrc}
                            alt={line.product.name || "Product"}
                            width={72}
                            height={72}
                            className="h-[4.5rem] w-[4.5rem] rounded-xl border border-[rgba(20,109,126,0.14)] object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h2 className="line-clamp-2 text-sm font-semibold text-[var(--foreground-strong)]">
                                  {line.product.name}
                                </h2>
                                <p className="mt-1 text-sm text-[rgba(18,52,60,0.72)]">
                                  ₦{(line.product.salePriceIncTax || 0).toLocaleString()} each
                                </p>
                              </div>
                              <button
                                onClick={() => removeProductFromCart(line.product._id)}
                                className="text-lg text-rose-600 transition hover:text-rose-700"
                                aria-label="Remove item"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>

                            <p
                              className={`mt-2 text-xs leading-6 ${
                                line.isSoldOut
                                  ? "text-rose-600"
                                  : line.exceedsStock
                                    ? "text-amber-700"
                                    : "theme-muted-page"
                              }`}
                            >
                              {line.isSoldOut
                                ? "Currently unavailable. Remove before checkout."
                                : line.exceedsStock
                                  ? `Reduce quantity to ${line.availableQuantity} to continue.`
                                  : `${line.availableQuantity} available for this reservation window`}
                            </p>

                            <div className="mt-4 flex items-end justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    handleQuantityChange(
                                      line.product._id,
                                      line.quantity - 1,
                                      line.availableQuantity
                                    )
                                  }
                                  aria-label="Decrease quantity"
                                  disabled={line.quantity <= 1 || line.isSoldOut}
                                  className="theme-button-secondary inline-flex h-9 w-9 items-center justify-center rounded-xl text-lg font-bold disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  −
                                </button>
                                <span className="min-w-[2rem] text-center text-sm font-semibold text-[var(--foreground-strong)]">
                                  {line.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    handleQuantityChange(
                                      line.product._id,
                                      line.quantity + 1,
                                      line.availableQuantity
                                    )
                                  }
                                  aria-label="Increase quantity"
                                  disabled={line.isSoldOut || line.quantity >= line.availableQuantity}
                                  className="theme-button-secondary inline-flex h-9 w-9 items-center justify-center rounded-xl text-lg font-bold disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  +
                                </button>
                              </div>

                              <div className="text-right">
                                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[rgba(18,52,60,0.46)]">
                                  Line total
                                </p>
                                <p className="mt-1 text-sm font-semibold text-[var(--foreground-strong)]">
                                  ₦{((line.product.salePriceIncTax || 0) * line.quantity).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mb-8 hidden overflow-x-auto sm:block">
                    <table className="min-w-full text-left text-sm text-[var(--foreground)]">
                      <thead>
                        <tr className="bg-[rgba(20,148,182,0.08)] text-xs uppercase tracking-wider text-[rgba(18,52,60,0.62)]">
                          <th className="py-3 px-3 rounded-tl-xl">Product</th>
                          <th className="py-3 px-3 text-center">Quantity</th>
                          <th className="py-3 px-3 text-center">Price</th>
                          <th className="py-3 px-3 text-right rounded-tr-xl">Remove</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[rgba(20,109,126,0.1)] rounded-b-xl">
                        {cartLines.map((line, index) => (
                          <tr
                            key={line.product._id}
                            className={`transition duration-200 ${
                              index % 2 === 0 ? "bg-white/55" : "bg-[rgba(20,148,182,0.04)]"
                            } hover:bg-[rgba(20,148,182,0.08)]`}
                          >
                            <td className="px-2 py-3 sm:px-3">
                              <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:items-start sm:gap-4 sm:text-left">
                                <Image
                                  src={line.imageSrc}
                                  alt={line.product.name || "Product"}
                                  width={50}
                                  height={50}
                                  className="rounded-md border border-[rgba(20,109,126,0.14)] object-cover"
                                />
                                <div>
                                  <h2 className="text-sm font-medium text-[var(--foreground-strong)] sm:text-base">
                                    {line.product.name}
                                  </h2>
                                  <p className="text-xs text-[rgba(18,52,60,0.72)] sm:text-sm">
                                    ₦{(line.product.salePriceIncTax || 0).toLocaleString()}
                                  </p>
                                  <p
                                    className={`text-xs sm:text-sm ${
                                      line.isSoldOut
                                        ? "text-rose-600"
                                        : line.exceedsStock
                                          ? "text-amber-700"
                                          : "theme-muted-page"
                                    }`}
                                  >
                                    {line.isSoldOut
                                      ? "Currently unavailable. Remove before checkout."
                                      : line.exceedsStock
                                        ? `Reduce quantity to ${line.availableQuantity} to continue.`
                                        : `${line.availableQuantity} available for this reservation window`}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-2 py-3 text-center sm:px-4">
                              <div className="flex flex-col items-center justify-center gap-1 sm:flex-row sm:gap-2">
                                <button
                                  onClick={() =>
                                    handleQuantityChange(
                                      line.product._id,
                                      line.quantity - 1,
                                      line.availableQuantity
                                    )
                                  }
                                  aria-label="Decrease quantity"
                                  disabled={line.quantity <= 1 || line.isSoldOut}
                                  className="theme-button-secondary h-8 w-8 rounded-md text-lg font-bold focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  −
                                </button>
                                <span className="min-w-[2rem] text-center text-sm font-semibold sm:text-base">
                                  {line.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    handleQuantityChange(
                                      line.product._id,
                                      line.quantity + 1,
                                      line.availableQuantity
                                    )
                                  }
                                  aria-label="Increase quantity"
                                  disabled={line.isSoldOut || line.quantity >= line.availableQuantity}
                                  className="theme-button-secondary h-8 w-8 rounded-md text-lg font-bold focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  +
                                </button>
                              </div>
                            </td>

                            <td className="px-2 py-3 text-center text-sm font-semibold text-[var(--foreground-strong)] sm:px-3 sm:text-base">
                              ₦{((line.product.salePriceIncTax || 0) * line.quantity).toLocaleString()}
                            </td>

                            <td className="px-2 py-3 text-center sm:px-3 sm:text-right">
                              <button
                                onClick={() => removeProductFromCart(line.product._id)}
                                className="text-lg text-rose-600 transition hover:text-rose-700 sm:text-xl"
                                aria-label="Remove item"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>

                    </table>
                  </div>

                  <div className="flex flex-col items-center justify-between gap-4 border-t border-[rgba(20,109,126,0.12)] pt-6 sm:flex-row">
                    <div className="text-lg text-[var(--foreground-strong)] sm:text-xl">
                      Subtotal:{" "}
                      <span className="font-semibold">
                        ₦{subtotal.toLocaleString()}
                      </span>
                    </div>
                    <Link
                      href={getPublicScopedHref(siteKey, "/")}
                      className="theme-button-secondary inline-block w-full rounded-lg px-6 py-3 text-center transition sm:w-auto"
                    >
                      Continue Shopping
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* Order Info + Customer Details */}
            <div className="panel-surface space-y-5 rounded-[1.75rem] p-5 sm:space-y-6 sm:rounded-2xl sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Order Information
              </h2>

              <div className="space-y-4 text-cyan-50/90 text-sm sm:text-base">
                <div className="flex justify-between border-b border-cyan-200/10 pb-2">
                  <span>Items:</span>
                  <span>{totalItems}</span>
                </div>
                {summaryItems.map((item) => (
                  <div key={item.label} className="flex justify-between border-b border-cyan-200/10 pb-2">
                    <span>{item.label}:</span>
                    <span>{item.value}</span>
                  </div>
                ))}
                <div className="flex justify-between text-lg sm:text-xl font-semibold pt-4">
                  <span>Total:</span>
                  <span>₦{totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {quoteMessage && (
                <div className="theme-card-soft rounded-xl px-4 py-3 text-sm text-cyan-50">
                  {quoteMessage}
                </div>
              )}

              <div className="border-t border-cyan-200/10 pt-6">
                <h3 className="text-lg font-semibold mb-4 text-white">
                  Customer Information
                </h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="theme-input w-full rounded-xl px-4 py-3"
                    value={customer.name}
                    onChange={(e) =>
                      setCustomer({ ...customer, name: e.target.value })
                    }
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    className="theme-input w-full rounded-xl px-4 py-3"
                    value={customer.email}
                    onChange={(e) =>
                      setCustomer({ ...customer, email: e.target.value })
                    }
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    className="theme-input w-full rounded-xl px-4 py-3"
                    value={customer.phone}
                    onChange={(e) =>
                      setCustomer({ ...customer, phone: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    placeholder="Street Address"
                    className="theme-input w-full rounded-xl px-4 py-3"
                    value={customer.address}
                    onChange={(e) =>
                      setCustomer({ ...customer, address: e.target.value })
                    }
                  />
                  <label className="block text-sm font-medium text-cyan-50/85">
                    Delivery City
                    <select
                      className="theme-input mt-1 w-full rounded-xl px-4 py-3"
                      value={customer.city}
                      onChange={(e) => {
                        setPricingPreview(null);
                        setCustomer({ ...customer, city: e.target.value });
                      }}
                    >
                      {SUPPORTED_SHIPPING_DESTINATIONS.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              {checkoutError && (
                <div className="rounded-lg border border-red-200/30 bg-red-200/10 px-4 py-3 text-sm text-red-100">
                  {checkoutError}
                </div>
              )}

              <div className="theme-card-soft rounded-xl px-4 py-3 text-sm text-cyan-50/85">
                Prices and delivery fees are confirmed before your order is placed.
                Signed-in customers can also use their saved details automatically.
              </div>

              <button
                onClick={handleCheckout}
                disabled={isLoading || displayedProducts.length === 0 || hasInventoryIssues}
                className={`w-full min-h-[3.35rem] rounded-xl py-3 font-semibold text-white transition ${
                  isLoading || displayedProducts.length === 0 || hasInventoryIssues
                    ? "bg-white/10 text-cyan-100/45 cursor-not-allowed"
                    : "theme-button-accent"
                }`}
              >
                {isLoading
                  ? "Processing..."
                  : hasInventoryIssues
                    ? "Resolve stock alerts to continue"
                    : "Place order"}
              </button>
            </div>
          </div>
        </div>
      </Center>
    </>
  );
}
