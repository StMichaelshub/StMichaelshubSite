import Link from "next/link";
import ProductBox from "./ProductBox";
import Center from "./Center";
import { getCatalogInsights } from "@/lib/storefront";
import { getPublicSitePath } from "@/lib/publicSite";

/** Category shortcuts and the newest products, each with one clear "see all" link. */
export default function NewProducts({ newProducts, catalogInsights, site }) {
  const insights = catalogInsights || getCatalogInsights(newProducts || []);
  const productsHref = getPublicSitePath(site.key, "/products");
  const products = (newProducts || []).slice(0, 8);

  return (
    <div className="px-4 pb-10 sm:px-8">
      <Center>
        {insights.topCategories.length > 0 && (
          <section className="mt-8" aria-labelledby="shop-by-category">
            <div className="flex items-end justify-between gap-3">
              <h2 id="shop-by-category" className="text-2xl font-bold text-[var(--foreground-strong)]">
                Shop by category
              </h2>
              <Link href={getPublicSitePath(site.key, "/categories")} className="text-sm font-semibold text-[#8d5a1f] hover:underline">
                All categories →
              </Link>
            </div>
            <div className="chip-scroll mt-4 flex gap-2.5 overflow-x-auto pb-2">
              {insights.topCategories.map((category) => (
                <Link
                  key={category.name}
                  href={{ pathname: productsHref, query: { category: category.name } }}
                  className="store-button-secondary inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold"
                >
                  {category.name}
                  <span className="rounded-full bg-[rgba(31,44,51,0.08)] px-2 py-0.5 text-xs text-[rgba(18,52,60,0.72)]">
                    {category.count}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8" aria-labelledby="new-arrivals">
          <div className="flex items-end justify-between gap-3">
            <h2 id="new-arrivals" className="text-2xl font-bold text-[var(--foreground-strong)]">
              New arrivals
            </h2>
            <Link href={productsHref} className="text-sm font-semibold text-[#8d5a1f] hover:underline">
              View all →
            </Link>
          </div>

          {products.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {products.map((product) => (
                <ProductBox key={product._id} {...product} siteKey={site.key} />
              ))}
            </div>
          ) : (
            <p className="mt-6 rounded-2xl border border-dashed border-[rgba(31,44,51,0.16)] p-8 text-center theme-muted-page">
              {site.emptyCatalogMessage}
            </p>
          )}

          {products.length > 0 && (
            <div className="mt-6 flex justify-center">
              <Link href={productsHref} className="store-button-primary rounded-xl px-6 py-3 text-sm font-semibold">
                Browse all products
              </Link>
            </div>
          )}
        </section>
      </Center>
    </div>
  );
}
