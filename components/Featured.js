import { useContext } from "react";
import Image from "next/image";
import Center from "./Center";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartShopping } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { CartContext } from "./CartContext";
import { getPrimaryProductImage } from "@/lib/productImages";
import { getAvailableInventoryQuantity } from "@/lib/inventory";
import { getPublicProductPath, getPublicSitePath } from "@/lib/publicSite";

export default function Featured({ product, catalogInsights, site, heroContent }) {
  const { addProductToCart, cartProducts } = useContext(CartContext);
  const availableQuantity = getAvailableInventoryQuantity(product);
  const cartQuantity = cartProducts.find((item) => item.id === product._id)?.qty || 0;
  const hasReachedCartLimit = availableQuantity > 0 && cartQuantity >= availableQuantity;
  const canAddFeaturedProduct = availableQuantity > 0 && !hasReachedCartLimit;

  function addFeatureProductToCart() {
    addProductToCart(product._id, { maxQuantity: availableQuantity });
  }

  if (!product) {
    return (
      <div className="px-4 py-16 text-center theme-muted-page sm:px-8">
        We are preparing something special for this spot.
      </div>
    );
  }

  const productImage = getPrimaryProductImage(product.images);
  const activeHero = heroContent?.activeHero || null;
  const heroTitle = activeHero?.title || site.heroTitle;
  const heroDescription = activeHero?.subtitle || site.heroDescription;
  const heroCtaHref = activeHero?.ctaLink || getPublicProductPath(site.key, product._id);
  const heroCtaLabel = activeHero?.ctaText || "View featured item";
  const heroImage = activeHero?.bgImage?.[0]?.full || activeHero?.image?.[0]?.full || productImage;
  const topCategories = catalogInsights?.topCategories || [];
  const normalizedDescription = product.description?.trim() || "";
  const productDescription =
    normalizedDescription && normalizedDescription.toLowerCase() !== (product.name || "").trim().toLowerCase()
      ? normalizedDescription
      : "";
  return (
    <div className="px-4 py-8 sm:px-8 lg:py-10">
      <Center>
        <section className="store-shell rounded-[2rem] px-5 py-6 md:px-7 md:py-7 lg:px-8 lg:py-8">
          <div className="relative mx-auto grid max-w-7xl gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)] xl:items-start">
            <div>
              <span className="store-tag inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em]">
                {site.heroEyebrow}
              </span>
              <h1 className="mt-4 max-w-4xl text-4xl font-extrabold leading-[1.02] text-[var(--foreground-strong)] lg:text-[3.95rem]">
                {heroTitle}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-8 store-shell-muted lg:text-lg">
                {heroDescription}
              </p>
              {productDescription ? (
                <p className="mt-3 max-w-3xl text-sm leading-7 text-[rgba(18,52,60,0.66)] sm:text-base">
                  Featured pick: {productDescription}
                </p>
              ) : null}

              <div className="mt-6 rounded-[1.5rem] border border-[rgba(31,44,51,0.08)] bg-[rgba(255,255,255,0.56)] p-4 sm:p-5">
                <div className="flex flex-col gap-3 border-b border-[rgba(31,44,51,0.08)] pb-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--foreground-strong)]">
                      Browse the latest products.
                    </h2>
                  </div>
                  <Link
                    href={getPublicSitePath(site.key, "/products")}
                    className="store-button-secondary inline-flex min-h-[2.9rem] items-center justify-center rounded-[1rem] px-5 py-3 text-sm font-semibold"
                  >
                    Browse products
                  </Link>
                </div>

                <div className="mt-4 flex flex-wrap gap-2.5">
                  {topCategories.length > 0 ? (
                    topCategories.map((category) => (
                      <Link
                        key={category.name}
                        href={{
                          pathname: getPublicSitePath(site.key, "/products"),
                          query: { category: category.name },
                        }}
                        className="store-button-secondary inline-flex items-center gap-3 rounded-full px-4 py-2 text-sm font-medium"
                      >
                        <span>{category.name}</span>
                        <span className="rounded-full bg-[rgba(31,44,51,0.08)] px-2 py-1 text-xs font-semibold text-[rgba(18,52,60,0.72)]">
                          {category.count}
                        </span>
                      </Link>
                    ))
                  ) : null}
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href={heroCtaHref}
                  className="store-button-primary inline-flex min-h-[3.6rem] items-center justify-center rounded-[1.1rem] px-6 py-3 font-semibold sm:min-w-[12rem]"
                >
                  {heroCtaLabel}
                </Link>
                <Link
                  href={getPublicSitePath(site.key, "/categories")}
                  className="store-button-secondary inline-flex min-h-[3.6rem] items-center justify-center rounded-[1.1rem] px-6 py-3 font-semibold sm:min-w-[12rem]"
                >
                  {site.secondaryCtaLabel}
                </Link>
                <button
                  onClick={addFeatureProductToCart}
                  disabled={!canAddFeaturedProduct}
                  className={`flex min-h-[3.6rem] items-center justify-center gap-2 rounded-[1.1rem] px-6 py-3 font-semibold transition sm:min-w-[12rem] ${
                    canAddFeaturedProduct
                      ? "store-button-accent cursor-pointer"
                      : "bg-[rgba(18,52,60,0.08)] text-[rgba(18,52,60,0.4)] cursor-not-allowed"
                  }`}
                >
                  <FontAwesomeIcon icon={faCartShopping} />
                  {availableQuantity === 0
                    ? "Unavailable"
                    : hasReachedCartLimit
                      ? "Cart limit reached"
                      : "Add to Cart"}
                </button>
              </div>
              {availableQuantity === 0 && (
                <p className="mt-3 text-sm theme-muted-page">
                  This item is currently unavailable.
                </p>
              )}
            </div>

            <div className="grid gap-3.5 xl:sticky xl:top-28">
              <div className="store-shell-card rounded-[1.65rem] p-4 sm:p-5">
                <div className="rounded-[1.45rem] border border-[rgba(31,44,51,0.08)] bg-[rgba(255,255,255,0.9)] p-4">
                  <div className="aspect-[4/3] overflow-hidden rounded-[1.35rem] bg-[linear-gradient(180deg,_rgba(248,243,236,0.96),_rgba(255,255,255,0.98))]">
                <Image
                    src={heroImage}
                    alt={activeHero?.title || product.name || "Featured Product"}
                  width={600}
                  height={400}
                  priority
                  sizes="(max-width: 768px) 90vw, 48vw"
                      className={activeHero ? "h-full w-full object-cover" : "h-full w-full object-contain p-4"}
                />
                  </div>
                </div>

                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[rgba(18,52,60,0.5)]">
                      {site.featuredProductLabel}
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-[var(--foreground-strong)]">
                      {product.name}
                    </h2>
                  </div>
                  <div className="text-right">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[rgba(18,52,60,0.5)]">
                      Price
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#8d5a1f]">
                      ₦{product.salePriceIncTax?.toLocaleString()}
                    </p>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </section>
      </Center>
    </div>
  );
}
