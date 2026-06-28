import Link from "next/link";
import ProductBox from "./ProductBox";
import Center from "./Center";
import { getCatalogInsights } from "@/lib/storefront";
import { getPublicSitePath } from "@/lib/publicSite";

export default function NewProducts({ newProducts, catalogInsights, site }) {
  const insights = catalogInsights || getCatalogInsights(newProducts || []);

  return (
    <div className="px-4 pb-10 sm:px-8 lg:pb-12">
      <Center>
        <section className="grid gap-5 xl:grid-cols-[minmax(280px,0.72fr)_minmax(0,1.28fr)]">
          <div className="store-shell rounded-[2rem] px-5 py-6 md:px-6 md:py-7">
            <span className="store-tag inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em]">
              New arrivals
            </span>
            <h2 className="mt-4 text-3xl font-bold text-[var(--foreground-strong)]">
              New {site.shortLabel} arrivals
            </h2>
            <p className="mt-3 max-w-md text-base leading-8 store-shell-muted">The latest items are grouped here for quick browsing.</p>

            <div className="mt-5 rounded-[1.45rem] border border-[rgba(31,44,51,0.08)] bg-[rgba(255,255,255,0.56)] p-4">
              <div className="flex items-center justify-between gap-3 border-b border-[rgba(31,44,51,0.08)] pb-3">
                <p className="text-sm font-semibold text-[var(--foreground-strong)]">Popular categories</p>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(18,52,60,0.48)]">Top {insights.topCategories.length}</span>
              </div>

              <div className="mt-4 grid gap-2.5">
                {insights.topCategories.length > 0 ? (
                  insights.topCategories.map((category) => (
                    <Link
                      key={category.name}
                      href={{
                        pathname: getPublicSitePath(site.key, "/products"),
                        query: { category: category.name },
                      }}
                      className="store-button-secondary flex items-center justify-between rounded-[1.1rem] px-4 py-3 text-sm font-medium"
                    >
                        <span className="block font-semibold text-[var(--foreground-strong)]">{category.name}</span>
                      <span className="rounded-full bg-[rgba(31,44,51,0.08)] px-2.5 py-1 text-xs font-semibold text-[rgba(18,52,60,0.72)]">
                        {category.count}
                      </span>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm store-shell-muted">Categories will appear here when more items are published.</p>
                )}
              </div>
            </div>

            <Link
              href={getPublicSitePath(site.key, "/products")}
              className="store-button-primary mt-5 inline-flex min-h-[3.15rem] items-center justify-center rounded-[1.1rem] px-5 py-3 text-sm font-semibold"
            >
              Browse products
            </Link>
          </div>

          <div className="store-shell rounded-[2rem] px-5 py-5 sm:px-6 sm:py-6 md:px-7">
            <div className="mb-5 flex flex-col gap-3 border-b border-[rgba(31,44,51,0.08)] pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[rgba(18,52,60,0.48)]">
                  Latest items
                </p>
                <h3 className="mt-2 text-2xl font-bold text-[var(--foreground-strong)]">
                  Products ready to view
                </h3>
              </div>
              <p className="max-w-sm text-sm leading-7 store-shell-muted">
                Each card keeps only the useful details.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {newProducts?.length > 0 ? (
                newProducts.map((product) => (
                  <div key={product._id}>
                    <ProductBox {...product} siteKey={site.key} />
                  </div>
                ))
              ) : (
                <p className="col-span-full text-center theme-muted-page">{site.emptyCatalogMessage}</p>
              )}
            </div>
          </div>
        </section>
      </Center>
    </div>
  );
}
