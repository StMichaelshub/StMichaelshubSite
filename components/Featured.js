import { useContext, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartShopping, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import Center from "./Center";
import { CartContext } from "./CartContext";
import { getPrimaryProductImage } from "@/lib/productImages";
import { getAvailableInventoryQuantity } from "@/lib/stockMath";
import { getPublicProductPath, getPublicSitePath } from "@/lib/publicSite";

/**
 * Store home hero: headline, a big search box and the two main actions,
 * with the featured item (or the active banner from admin) alongside.
 */
export default function Featured({ product, site, heroContent }) {
  const { addProductToCart, cartProducts } = useContext(CartContext);
  const router = useRouter();
  const [searchText, setSearchText] = useState("");

  const activeHero = heroContent?.activeHero || null;
  const heroTitle = activeHero?.title || site.heroTitle;
  const heroDescription = activeHero?.subtitle || site.heroDescription;
  const productsHref = getPublicSitePath(site.key, "/products");

  const availableQuantity = product ? getAvailableInventoryQuantity(product) : 0;
  const cartQuantity = product ? cartProducts.find((item) => item.id === product._id)?.qty || 0 : 0;
  const canAddToCart = Boolean(product) && availableQuantity > 0 && cartQuantity < availableQuantity;
  const productImage = product ? getPrimaryProductImage(product.images) : null;
  const heroImage = activeHero?.bgImage?.[0]?.full || activeHero?.image?.[0]?.full || productImage;
  const heroCtaHref = activeHero?.ctaLink || (product ? getPublicProductPath(site.key, product._id) : productsHref);
  const heroCtaLabel = activeHero?.ctaText || (product ? "View item" : "Shop now");

  const submitSearch = (event) => {
    event.preventDefault();
    const query = searchText.trim();
    router.push({ pathname: productsHref, query: query ? { q: query } : {} });
  };

  return (
    <div className="px-4 pt-6 sm:px-8 lg:pt-8">
      <Center>
        <section className="store-shell rounded-[2rem] px-5 py-7 sm:px-8 lg:px-10 lg:py-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)] lg:items-center">
            <div>
              <span className="store-tag inline-flex rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em]">
                {site.heroEyebrow}
              </span>
              <h1 className="mt-4 text-3xl font-extrabold leading-tight text-[var(--foreground-strong)] sm:text-4xl lg:text-5xl">
                {heroTitle}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 store-shell-muted sm:text-lg">{heroDescription}</p>

              <form onSubmit={submitSearch} role="search" className="mt-6 max-w-xl">
                <label htmlFor="hero-search" className="sr-only">Search products</label>
                <div className="flex items-center rounded-2xl border border-[rgba(31,44,51,0.14)] bg-white pl-4 shadow-sm focus-within:border-[rgba(176,114,42,0.45)]">
                  <FontAwesomeIcon icon={faMagnifyingGlass} className="text-[rgba(18,52,60,0.5)]" />
                  <input
                    id="hero-search"
                    type="search"
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder="What are you looking for?"
                    className="w-full bg-transparent px-3 py-3.5 text-base text-[var(--foreground-strong)] outline-none"
                  />
                  <button type="submit" className="store-button-accent m-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold">
                    Search
                  </button>
                </div>
              </form>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link href={productsHref} className="store-button-primary inline-flex items-center justify-center rounded-xl px-6 py-3 font-semibold">
                  Shop all products
                </Link>
                <Link
                  href={getPublicSitePath(site.key, "/categories")}
                  className="store-button-secondary inline-flex items-center justify-center rounded-xl px-6 py-3 font-semibold"
                >
                  {site.secondaryCtaLabel}
                </Link>
              </div>
            </div>

            {heroImage ? (
              <div className="store-shell-card rounded-[1.6rem] p-4">
                <Link href={heroCtaHref} className="block">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-[linear-gradient(180deg,_rgba(248,243,236,0.96),_rgba(255,255,255,0.98))]">
                    <Image
                      src={heroImage}
                      alt={activeHero?.title || product?.name || "Featured"}
                      fill
                      priority
                      sizes="(max-width: 1024px) 90vw, 40vw"
                      className={activeHero ? "object-cover" : "object-contain p-4"}
                    />
                  </div>
                </Link>
                {product && !activeHero ? (
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(18,52,60,0.5)]">
                        {site.featuredProductLabel}
                      </p>
                      <p className="mt-1 truncate text-lg font-bold text-[var(--foreground-strong)]">{product.name}</p>
                      <p className="text-lg font-bold text-[#8d5a1f]">₦{Number(product.salePriceIncTax || 0).toLocaleString()}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addProductToCart(product._id, { maxQuantity: availableQuantity })}
                      disabled={!canAddToCart}
                      className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${
                        canAddToCart ? "store-button-accent" : "cursor-not-allowed bg-[rgba(18,52,60,0.08)] text-[rgba(18,52,60,0.4)]"
                      }`}
                    >
                      <FontAwesomeIcon icon={faCartShopping} />
                      {availableQuantity === 0 ? "Sold out" : canAddToCart ? "Add" : "In cart"}
                    </button>
                  </div>
                ) : (
                  <Link href={heroCtaHref} className="store-button-accent mt-4 flex justify-center rounded-xl px-5 py-3 text-sm font-semibold">
                    {heroCtaLabel}
                  </Link>
                )}
              </div>
            ) : null}
          </div>
        </section>
      </Center>
    </div>
  );
}
