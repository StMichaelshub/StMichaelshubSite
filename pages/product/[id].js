import Center from "@/components/Center";
import Header from "@/components/Header";
import Image from "next/image";
import Link from "next/link";
import { useContext, useState, useRef } from "react";
import Head from "next/head";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import { CartContext } from "@/components/CartContext";
import ReviewForm from "@/components/ReviewForm";
import {
  getPrimaryProductImage,
  normalizeProductImages,
  PRODUCT_IMAGE_PLACEHOLDER,
} from "@/lib/productImages";
import { getReviewSummary } from "@/lib/reviews";
import ProductBox from "@/components/ProductBox";
import { getAvailableInventoryQuantity } from "@/lib/inventory";
import {
  getStorefrontProductById,
  getStorefrontProducts,
} from "@/lib/storefrontCatalog";
import {
  getPublicScopedHref,
  getPublicSiteConfig,
  inferPublicSiteFromPath,
  normalizePublicSite,
} from "@/lib/publicSite";

export default function ProductPage({ product, relatedProducts }) {
  const router = useRouter();
  const siteKey = normalizePublicSite(inferPublicSiteFromPath(router.pathname));
  const site = getPublicSiteConfig(siteKey);
  const isHotelSite = siteKey === "hotel";
  const galleryImages = normalizeProductImages(product.images);
  const defaultImage = getPrimaryProductImage(product.images);
  const [activeImage, setActiveImage] = useState(defaultImage);
  const { addProductToCart, cartProducts } = useContext(CartContext);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [reviews, setReviews] = useState(product.reviews || []);
  const mainImageRef = useRef(null);
  const reviewSummary = getReviewSummary(reviews);
  const availableQuantity = getAvailableInventoryQuantity(product);
  const isInStock = availableQuantity > 0;
  const storeAvailabilityLabel = isInStock ? "200 Ready" : "Currently unavailable";
  const cartQuantity = cartProducts.find((item) => item.id === product._id)?.qty || 0;
  const hasReachedCartLimit = isInStock && cartQuantity >= availableQuantity;
  const normalizedDescription = product.description?.trim() || "";
  const resolvedDescription =
    normalizedDescription && normalizedDescription.toLowerCase() !== (product.name || "").trim().toLowerCase()
      ? normalizedDescription
      : "";
  const detailStats = [
    {
      label: "Reviews",
      value: reviewSummary.count ? `${reviewSummary.averageLabel} / 5` : "No reviews yet",
      meta: reviewSummary.count ? `${reviewSummary.count} published review${reviewSummary.count === 1 ? "" : "s"}` : "",
    },
    {
      label: "Availability",
      value: storeAvailabilityLabel,
      meta: isInStock ? `${availableQuantity} ready for delivery` : "Check related items below",
    },
    {
      label: "In your cart",
      value: `${cartQuantity}`,
      meta: `${cartQuantity} item${cartQuantity === 1 ? "" : "s"} selected`,
      spanFull: true,
    },
  ];

  const handleAddToCart = () => {
    if (!isInStock || hasReachedCartLimit) {
      return;
    }

    const productImage = mainImageRef.current;
    const cartIcon = Array.from(document.querySelectorAll("[data-cart-icon]"))
      .find((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });

    if (productImage && cartIcon) {
      const imgClone = productImage.cloneNode(true);
      const imgRect = productImage.getBoundingClientRect();
      const cartRect = cartIcon.getBoundingClientRect();

      imgClone.style.position = "fixed";
      imgClone.style.left = `${imgRect.left}px`;
      imgClone.style.top = `${imgRect.top}px`;
      imgClone.style.width = `${imgRect.width}px`;
      imgClone.style.height = `${imgRect.height}px`;
      imgClone.style.zIndex = 1000;
      imgClone.style.transition = "all 0.7s ease-in-out";
      imgClone.style.opacity = 0.8;

      document.body.appendChild(imgClone);

      requestAnimationFrame(() => {
        imgClone.style.left = `${cartRect.left + cartRect.width / 2}px`;
        imgClone.style.top = `${cartRect.top + cartRect.height / 2}px`;
        imgClone.style.width = "20px";
        imgClone.style.height = "20px";
        imgClone.style.opacity = 0;
      });

      imgClone.addEventListener("transitionend", () => {
        imgClone.remove();
      });
    }

    addProductToCart(product._id, { maxQuantity: availableQuantity });
  };

  const handleReviewSubmitted = (review) => {
    setReviews((previousReviews) => [review, ...previousReviews]);
  };

  if (!isHotelSite) {
    return (
      <>
        <Head>
          <title>{`${product.name} | ${site.displayName}`}</title>
        </Head>
        <Header siteKey={siteKey} />
        <Center>
          <div className="min-h-screen px-3 py-6 sm:px-8 sm:py-8">
            <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] xl:items-start">
              <section className="store-shell flex h-full flex-col rounded-[2rem] p-4 sm:p-6 lg:p-7">
                <div className="flex flex-col gap-3 border-b border-[rgba(31,44,51,0.08)] pb-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[rgba(18,52,60,0.48)]">
                      Product gallery
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-[var(--foreground-strong)]">
                      Inspect the item before you reserve it
                    </h2>
                  </div>
                  <p className="text-sm leading-7 store-shell-muted">Click the main image to open the full view.</p>
                </div>

                <div className="mt-5 rounded-[1.65rem] border border-[rgba(31,44,51,0.08)] bg-[rgba(255,255,255,0.76)] p-4 sm:p-5">
                  <div className="cursor-zoom-in rounded-[1.45rem] border border-[rgba(31,44,51,0.08)] bg-[linear-gradient(180deg,_rgba(248,243,236,0.96),_rgba(255,255,255,0.98))] p-4" onClick={() => setLightboxOpen(true)}>
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={activeImage}
                        ref={mainImageRef}
                        src={activeImage || PRODUCT_IMAGE_PLACEHOLDER}
                        alt={product.name}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="h-[320px] w-full rounded-[1.25rem] object-contain sm:h-[430px]"
                      />
                    </AnimatePresence>
                  </div>
                </div>

                <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                  {(galleryImages.length ? galleryImages : [{ full: PRODUCT_IMAGE_PLACEHOLDER, thumb: PRODUCT_IMAGE_PLACEHOLDER }]).map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImage(image.full)}
                      className={`overflow-hidden rounded-[1.05rem] border p-1.5 transition ${
                        image.full === activeImage
                          ? "border-[rgba(176,114,42,0.44)] bg-[rgba(247,243,236,0.96)]"
                          : "border-[rgba(31,44,51,0.08)] bg-white/82 hover:border-[rgba(31,44,51,0.16)]"
                      }`}
                    >
                      <Image
                        src={image.thumb}
                        alt={`Product thumbnail ${index + 1}`}
                        width={88}
                        height={88}
                        className="h-[4.8rem] w-[4.8rem] rounded-[0.8rem] object-cover sm:h-[5.2rem] sm:w-[5.2rem]"
                      />
                    </button>
                  ))}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 sm:auto-rows-fr">
                  <div className="store-shell-card flex h-full flex-col justify-between rounded-[1.3rem] px-4 py-4">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[rgba(18,52,60,0.48)]">
                      Category
                    </p>
                    <p className="mt-2 text-base font-semibold text-[var(--foreground-strong)]">
                      {product.categoryName || product.category || "Uncategorized"}
                    </p>
                  </div>
                  <div className="store-shell-card flex h-full flex-col justify-between rounded-[1.3rem] px-4 py-4">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[rgba(18,52,60,0.48)]">
                      Reservation status
                    </p>
                    <p className="mt-2 text-base font-semibold text-[var(--foreground-strong)]">{storeAvailabilityLabel}</p>
                  </div>
                </div>
              </section>

              <aside className="store-shell flex h-full flex-col rounded-[2rem] p-5 sm:p-7">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="store-tag rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em]">
                    {product.categoryName || product.category || "Uncategorized"}
                  </span>
                  <span className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] ${
                    isInStock ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                  }`}>
                    {storeAvailabilityLabel}
                  </span>
                </div>

                <h1 className="mt-5 text-3xl font-extrabold text-[var(--foreground-strong)] sm:text-[2.6rem]">
                  {product.name}
                </h1>
                {resolvedDescription ? (
                  <p className="mt-4 max-w-[34rem] text-base leading-8 store-shell-muted">
                    {resolvedDescription}
                  </p>
                ) : null}

                <div className="mt-6 grid gap-3 sm:grid-cols-2 sm:auto-rows-fr">
                  {detailStats.map((stat) => (
                    <div key={stat.label} className={`store-shell-card flex h-full flex-col rounded-[1.25rem] px-4 py-4 ${stat.spanFull ? "sm:col-span-2" : ""}`}>
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[rgba(18,52,60,0.48)]">
                        {stat.label}
                      </p>
                      <p className="mt-2 text-xl font-bold text-[var(--foreground-strong)]">{stat.value}</p>
                      {stat.meta ? <p className="mt-1 text-sm store-shell-muted">{stat.meta}</p> : null}
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-5 border-t border-[rgba(31,44,51,0.08)] pt-6">
                  <div className="rounded-[1.45rem] border border-[rgba(31,44,51,0.08)] bg-[rgba(255,255,255,0.62)] px-5 py-5">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[rgba(18,52,60,0.48)]">
                      Current price
                    </p>
                    <p className="mt-2 text-3xl font-bold text-[#8d5a1f] sm:text-[2.2rem]">
                      ₦{product.salePriceIncTax?.toLocaleString()}
                    </p>
                  </div>

                  <div className="rounded-[1.35rem] border border-[rgba(31,44,51,0.08)] bg-[rgba(247,243,236,0.86)] px-4 py-4 text-sm leading-7 text-[rgba(18,52,60,0.78)]">
                    {availableQuantity === 0
                      ? "This item is currently unavailable."
                      : cartQuantity > 0
                        ? `${cartQuantity} item${cartQuantity === 1 ? "" : "s"} currently in your cart.`
                        : "Add this item to your cart when you are ready."}
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={handleAddToCart}
                    disabled={!isInStock || hasReachedCartLimit}
                    className={`w-full rounded-[1rem] py-3 text-base font-semibold transition ${
                      isInStock && !hasReachedCartLimit
                        ? "store-button-accent"
                        : "bg-[rgba(18,52,60,0.08)] cursor-not-allowed text-[rgba(18,52,60,0.4)]"
                    }`}
                  >
                    {!isInStock
                      ? "Unavailable"
                      : hasReachedCartLimit
                        ? "Cart limit reached"
                        : "Add to cart"}
                  </button>
                  <Link
                    href={getPublicScopedHref(siteKey, "/cart")}
                    className="store-button-secondary inline-flex items-center justify-center rounded-[1rem] px-4 py-3 text-base font-semibold"
                  >
                    Review cart
                  </Link>
                </div>

                <Link
                  href={{
                    pathname: getPublicScopedHref(siteKey, "/products"),
                    query: { category: product.categoryName || product.category || "" },
                  }}
                  className="mt-5 inline-flex text-sm font-semibold text-[#8d5a1f] transition hover:text-[var(--foreground-strong)]"
                >
                  Explore more in this category
                </Link>
              </aside>
            </div>

            <div className="mx-auto mt-8 grid max-w-7xl gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] xl:items-stretch">
              <section className="store-shell-card flex h-full flex-col rounded-[2rem] p-5 sm:p-6 lg:p-7">
                <div className="border-b border-[rgba(31,44,51,0.08)] pb-4">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[rgba(18,52,60,0.48)]">
                    Share your review
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-[var(--foreground-strong)]">Tell other customers what to expect</h2>
                </div>
                <div className="mt-5 flex-1 store-shell-card rounded-[1.4rem] p-4 sm:p-5">
                  <ReviewForm productId={product._id} onSubmitted={handleReviewSubmitted} />
                </div>
              </section>

              <section className="store-shell-card flex h-full flex-col rounded-[2rem] p-5 sm:p-6 lg:p-7">
                <div className="flex flex-col gap-4 border-b border-[rgba(31,44,51,0.08)] pb-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[rgba(18,52,60,0.48)]">
                      Customer reviews
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-[var(--foreground-strong)]">Published feedback</h2>
                  </div>
                  <div className="flex flex-wrap items-stretch gap-3">
                    <div className="store-shell-card flex min-w-[7.5rem] flex-col justify-between rounded-[1rem] px-4 py-3 text-sm">
                      <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[rgba(18,52,60,0.48)]">Average</span>
                      <span className="mt-1 block text-lg font-bold text-[var(--foreground-strong)]">
                        {reviewSummary.count ? reviewSummary.averageLabel : "New"}
                      </span>
                    </div>
                    <div className="store-shell-card flex min-w-[7.5rem] flex-col justify-between rounded-[1rem] px-4 py-3 text-sm">
                      <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[rgba(18,52,60,0.48)]">Reviews</span>
                      <span className="mt-1 block text-lg font-bold text-[var(--foreground-strong)]">{reviewSummary.count}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex-1 space-y-4">
                  {reviews.length > 0 ? (
                    reviews.map((review, index) => (
                      <div key={index} className="store-shell-card rounded-[1.35rem] p-4 sm:p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-base font-semibold text-[var(--foreground-strong)]">
                              {review.customerName || "Anonymous"}
                            </p>
                            <h3 className="mt-2 text-lg font-semibold text-[var(--foreground-strong)]">
                              {review.title}
                            </h3>
                          </div>
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`h-5 w-5 ${i < review.rating ? "text-yellow-400" : "text-gray-300"}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                aria-hidden="true"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.974a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.388 2.46a1 1 0 00-.364 1.118l1.287 3.974c.3.922-.755 1.688-1.54 1.118l-3.388-2.46a1 1 0 00-1.176 0l-3.388 2.46c-.784.57-1.838-.196-1.539-1.118l1.287-3.974a1 1 0 00-.364-1.118L2.045 9.4c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69l1.286-3.974z" />
                              </svg>
                            ))}
                          </div>
                        </div>

                        <p className="mt-3 leading-8 store-shell-muted">{review.text}</p>
                        <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-[rgba(18,52,60,0.48)]">
                          {new Date(review.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[1.35rem] border border-dashed border-[rgba(31,44,51,0.18)] px-5 py-10 text-center">
                      <p className="store-shell-muted">No reviews yet.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {relatedProducts?.length > 0 && (
              <section className="mx-auto mt-10 max-w-7xl store-shell rounded-[2rem] px-5 py-6 sm:px-6 sm:py-7 lg:px-8">
                <div className="mb-6 flex flex-col gap-2 border-b border-[rgba(31,44,51,0.08)] pb-5 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[rgba(18,52,60,0.48)]">Recommended next</p>
                    <h2 className="mt-2 text-3xl font-bold text-[var(--foreground-strong)]">More from the same catalog flow</h2>
                  </div>
                  <p className="text-sm leading-7 store-shell-muted">
                    Related picks you may also like.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-6">
                  {relatedProducts.map((relatedProduct) => (
                    <div key={relatedProduct._id}>
                      <ProductBox {...relatedProduct} siteKey={siteKey} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </Center>

        {lightboxOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            onClick={() => setLightboxOpen(false)}
          >
            <Image
              src={activeImage || PRODUCT_IMAGE_PLACEHOLDER}
              alt="Full View"
              width={1200}
              height={900}
              className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
            />
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{`${product.name} | ${site.displayName}`}</title>
      </Head>
      <Header siteKey={siteKey} />
      <Center>
        <div className="min-h-screen px-3 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto grid max-w-7xl items-start gap-6 sm:gap-8 md:grid-cols-[3fr_2fr] lg:gap-12">

            {/* Product Images */}
            <div className="theme-shell-light rounded-[1.75rem] p-4 sm:rounded-[2rem] sm:p-6">
              <div className="cursor-zoom-in" onClick={() => setLightboxOpen(true)}>
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeImage}
                    ref={mainImageRef}
                    src={activeImage || PRODUCT_IMAGE_PLACEHOLDER}
                    alt={product.name}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="h-[320px] w-full rounded-xl border border-white/80 bg-white/60 object-cover shadow-[0_24px_48px_rgba(18,52,60,0.14)] sm:h-[450px]"
                  />
                </AnimatePresence>
              </div>

              <div className="mt-4 flex gap-2 overflow-x-auto sm:gap-3">
                {(galleryImages.length ? galleryImages : [{ full: PRODUCT_IMAGE_PLACEHOLDER, thumb: PRODUCT_IMAGE_PLACEHOLDER }]).map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(image.full)}
                    className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 sm:h-20 sm:w-20 ${
                      image.full === activeImage
                        ? "border-[var(--brand)]"
                        : "border-transparent hover:border-[rgba(20,109,126,0.28)]"
                    }`}
                  >
                    <Image
                      src={image.thumb}
                      alt={`Product thumbnail ${index + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Details */}
            <div className="theme-shell-light rounded-[1.75rem] p-5 sm:rounded-[2rem] sm:p-8 md:sticky md:top-32">
              <div className="mb-4 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-[rgba(18,52,60,0.54)]">
                <span className="theme-card-light rounded-full px-3 py-2 shadow-sm text-[var(--foreground-strong)]">
                  {product.categoryName || product.category || "Uncategorized"}
                </span>
                <span className={`rounded-full border px-3 py-2 shadow-sm ${
                  isInStock
                    ? "border-emerald-200/80 bg-emerald-50 text-emerald-700"
                    : "border-rose-200/80 bg-rose-50 text-rose-700"
                }`}>
                  {isInStock ? `${availableQuantity} in stock` : "Currently unavailable"}
                </span>
              </div>
              <h1 className="mb-4 text-2xl font-bold text-[var(--foreground-strong)] sm:text-3xl">
                {product.name}
              </h1>
              <p className="mb-6 text-base leading-relaxed theme-muted-page">
                {product.description}
              </p>

              <div className="theme-card-light mb-6 grid grid-cols-2 gap-3 rounded-2xl p-4 text-sm shadow-sm sm:flex sm:flex-wrap sm:gap-4">
                <div>
                  <p className="font-semibold text-[var(--foreground-strong)]">Rating</p>
                  <p>{reviewSummary.count ? `${reviewSummary.averageLabel} / 5` : "No ratings yet"}</p>
                </div>
                <div>
                  <p className="font-semibold text-[var(--foreground-strong)]">Reviews</p>
                  <p>{reviewSummary.count} published</p>
                </div>
                <div>
                  <p className="font-semibold text-[var(--foreground-strong)]">SKU</p>
                  <p>{product.sku || "Not provided"}</p>
                </div>
                <div>
                  <p className="font-semibold text-[var(--foreground-strong)]">In your cart</p>
                  <p>{cartQuantity}</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-xl font-semibold text-[var(--accent)] sm:text-2xl">
                  ₦{product.salePriceIncTax?.toLocaleString()}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 text-sm theme-muted-page">
                <p>
                  <span className="font-medium text-[var(--foreground-strong)]">Category:</span>{" "}
                  {product.categoryName || product.category || "Uncategorized"}
                </p>
                <p>
                  <span className="font-medium text-[var(--foreground-strong)]">Availability:</span>{" "}
                  {isInStock ? `${availableQuantity} item(s) available for delivery` : "Out of stock"}
                </p>
              </div>

              <div className="theme-card-light mt-6 rounded-[1.5rem] p-4 text-sm shadow-sm">
                <p className="font-semibold text-[var(--foreground-strong)]">Reservation readiness</p>
                <p className="mt-2 theme-muted-page">
                  {availableQuantity === 0
                    ? "This item is temporarily unavailable. Check related products for alternatives."
                    : `You currently have ${cartQuantity} of ${availableQuantity} available unit${availableQuantity === 1 ? "" : "s"} reserved in your cart.`}
                </p>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <button
                  onClick={handleAddToCart}
                  disabled={!isInStock || hasReachedCartLimit}
                  className={`w-full rounded-xl py-3 text-lg font-medium transition duration-200 ${
                    isInStock && !hasReachedCartLimit
                      ? "theme-button-accent"
                      : "bg-[rgba(18,52,60,0.08)] cursor-not-allowed text-[rgba(18,52,60,0.4)]"
                  }`}
                >
                  {!isInStock
                    ? "Unavailable"
                    : hasReachedCartLimit
                      ? "Max reserved in cart"
                      : "Add to Cart"}
                </button>
                <Link
                  href={getPublicScopedHref(siteKey, "/cart")}
                  className="theme-card-light inline-flex items-center justify-center rounded-xl px-4 py-3 text-lg font-medium text-[var(--foreground-strong)] shadow-sm"
                >
                  Review Cart
                </Link>
              </div>
              <Link
                href={{
                  pathname: getPublicScopedHref(siteKey, "/products"),
                  query: { category: product.categoryName || product.category || "" },
                }}
                className="mt-4 inline-flex text-sm font-medium text-[var(--brand-strong)]"
              >
                Explore more in this category
              </Link>
            </div>
          </div>
          <div className="theme-shell-light mx-auto mt-8 max-w-7xl rounded-[1.75rem] p-5 sm:mt-12 sm:rounded-[2rem] sm:p-10">
  <h2 className="mb-8 border-b border-[rgba(20,109,126,0.12)] pb-4 text-2xl font-extrabold text-[var(--foreground-strong)] sm:mb-10 sm:text-3xl">
    Customer Reviews
  </h2>

  <div className="theme-card-light mb-8 grid gap-4 rounded-[1.5rem] p-4 shadow-sm sm:p-6 md:grid-cols-3">
    <div>
      <p className="text-sm uppercase tracking-[0.22em] text-[rgba(18,52,60,0.54)]">Average rating</p>
      <p className="mt-2 text-3xl font-bold text-[var(--foreground-strong)]">{reviewSummary.count ? reviewSummary.averageLabel : "New"}</p>
    </div>
    <div>
      <p className="text-sm uppercase tracking-[0.22em] text-[rgba(18,52,60,0.54)]">Published reviews</p>
      <p className="mt-2 text-3xl font-bold text-[var(--foreground-strong)]">{reviewSummary.count}</p>
    </div>
    <div>
      <p className="text-sm uppercase tracking-[0.22em] text-[rgba(18,52,60,0.54)]">Fulfillment</p>
      <p className="mt-2 text-3xl font-bold text-[var(--foreground-strong)]">{isInStock ? "In stock" : "Paused"}</p>
    </div>
  </div>

  <div className="flex flex-col md:flex-row gap-8">
    <div className="theme-card-light rounded-[1.5rem] p-5 shadow-sm sm:p-8 md:w-1/2">
      <ReviewForm productId={product._id} onSubmitted={handleReviewSubmitted} />
    </div>

    <div className="theme-card-light space-y-6 rounded-[1.5rem] p-5 shadow-sm sm:space-y-8 sm:p-8 md:w-1/2">
  <h3 className="mb-6 border-b border-[rgba(20,109,126,0.12)] pb-4 text-xl font-bold text-[var(--foreground-strong)] sm:text-2xl">
    All Reviews
  </h3>

  {reviews.length > 0 ? (
    reviews.map((review, index) => (
      <div
        key={index}
        className="rounded-2xl border border-[rgba(20,109,126,0.12)] bg-white/80 p-4 shadow-sm transition-shadow duration-300 hover:shadow-lg sm:p-6"
      >
        <div className="flex justify-between items-center mb-3">
          <p className="text-lg font-semibold tracking-wide text-[var(--foreground-strong)]">
            {review.customerName || "Anonymous"}
          </p>
          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`w-5 h-5 ${
                  i < review.rating ? "text-yellow-400" : "text-gray-300"
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.974a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.388 2.46a1 1 0 00-.364 1.118l1.287 3.974c.3.922-.755 1.688-1.54 1.118l-3.388-2.46a1 1 0 00-1.176 0l-3.388 2.46c-.784.57-1.838-.196-1.539-1.118l1.287-3.974a1 1 0 00-.364-1.118L2.045 9.4c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69l1.286-3.974z" />
              </svg>
            ))}
          </div>
        </div>

        <h4 className="mb-2 text-xl font-semibold tracking-tight text-[var(--foreground-strong)]">
          {review.title}
        </h4>

        <p className="mb-4 leading-relaxed theme-muted-page">{review.text}</p>

        <p className="font-mono text-xs tracking-wide text-[rgba(18,52,60,0.48)]">
          {new Date(review.createdAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </p>
      </div>
    ))
  ) : (
    <p className="mt-12 text-center text-lg italic theme-muted-page">
      No reviews yet. Be the first to review this product!
    </p>
  )}
</div>

  </div>
</div>


        </div>

        {relatedProducts?.length > 0 && (
          <div className="max-w-7xl mx-auto mt-12">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-[rgba(18,52,60,0.54)]">Recommended next</p>
                <h2 className="text-3xl font-bold text-[var(--foreground-strong)]">You may also like</h2>
              </div>
              <p className="text-sm theme-muted-page">
                More products from the same catalog flow.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-6">
              {relatedProducts.map((relatedProduct) => (
                <div key={relatedProduct._id}>
                  <ProductBox {...relatedProduct} siteKey={siteKey} />
                </div>
              ))}
            </div>
          </div>
        )}
      </Center>

      {/* Lightbox Overlay */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <Image
            src={activeImage || PRODUCT_IMAGE_PLACEHOLDER}
            alt="Full View"
            width={1200}
            height={900}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
      
        
    </>
  );
}

export async function getServerSideProps(context) {
  try {
    const { id } = context.query;
    const siteKey = normalizePublicSite(inferPublicSiteFromPath(context.resolvedUrl || ""));
    const product = await getStorefrontProductById(id, { site: siteKey });

    if (!product) {
      return {
        notFound: true,
      };
    }

    const catalogProducts = await getStorefrontProducts({ site: siteKey });
    const relatedProducts = catalogProducts.filter(
      (candidate) => String(candidate._id) !== String(product._id)
    );
    const sameCategoryProducts = relatedProducts.filter(
      (candidate) => candidate.category === product.category
    );
    const resolvedRelatedProducts = (
      sameCategoryProducts.length ? sameCategoryProducts : relatedProducts
    ).slice(0, 4);

    return {
      props: {
        product: JSON.parse(JSON.stringify(product)),
        relatedProducts: JSON.parse(JSON.stringify(resolvedRelatedProducts)),
      },
    };
  } catch (error) {
    console.error("Product page SSR error:", error);
    return {
      notFound: true,
    };
  }
}
