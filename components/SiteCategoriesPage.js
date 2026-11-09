import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useDeferredValue, useState } from "react";
import Center from "@/components/Center";
import Header from "@/components/Header";
import { getPrimaryProductImage } from "@/lib/productImages";
import { getAvailableInventoryQuantity } from "@/lib/stockMath";
import { getPublicSitePath } from "@/lib/publicSite";

/**
 * Categories as simple tiles. Tapping one opens the product list already
 * filtered to that category, so there is one place to browse and filter.
 */
export default function SiteCategoriesPage({ site, categories, productsByCategory }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = useDeferredValue(query).trim().toLowerCase();
  const productsHref = getPublicSitePath(site.key, "/products");

  const tiles = categories
    .map((category) => {
      const products = productsByCategory[category] || [];
      const previewProduct = products.find((product) => (product.images || []).length > 0) || products[0];
      return {
        name: category,
        count: products.length,
        availableCount: products.filter((product) => getAvailableInventoryQuantity(product) > 0).length,
        image: previewProduct ? getPrimaryProductImage(previewProduct.images) : null,
      };
    })
    .filter((tile) => !normalizedQuery || tile.name.toLowerCase().includes(normalizedQuery));

  return (
    <>
      <Head>
        <title>{`${site.categoryTitle} | ${site.displayName}`}</title>
      </Head>
      <Header siteKey={site.key} />
      <Center>
        <div className="min-h-screen px-3 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-[var(--foreground-strong)] sm:text-4xl">{site.categoryTitle}</h1>
              <p className="mt-1 text-sm store-shell-muted">Pick a category to see its products.</p>
            </div>
            <Link href={productsHref} className="text-sm font-semibold text-[#8d5a1f] hover:underline">
              View all products →
            </Link>
          </div>

          <label className="sr-only" htmlFor="category-search">Find a category</label>
          <input
            id="category-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a category"
            className="theme-input-light mt-5 w-full rounded-2xl px-4 py-3 outline-none sm:max-w-sm"
          />

          {tiles.length > 0 ? (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
              {tiles.map((tile) => (
                <Link
                  key={tile.name}
                  href={{ pathname: productsHref, query: { category: tile.name } }}
                  className="store-shell-card group overflow-hidden rounded-[1.25rem] transition hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(18,29,35,0.1)]"
                >
                  <div className="relative aspect-[4/3] bg-[linear-gradient(180deg,_rgba(248,243,236,0.96),_rgba(255,255,255,0.98))]">
                    {tile.image ? (
                      <Image
                        src={tile.image}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 48vw, 25vw"
                        className="object-contain p-4 transition group-hover:scale-105"
                      />
                    ) : null}
                  </div>
                  <div className="p-3 sm:p-4">
                    <p className="truncate text-base font-bold text-[var(--foreground-strong)] sm:text-lg">{tile.name}</p>
                    <p className="mt-0.5 text-xs store-shell-muted sm:text-sm">
                      {tile.count} product{tile.count === 1 ? "" : "s"}
                      {tile.availableCount < tile.count ? ` · ${tile.availableCount} in stock` : ""}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-[rgba(20,109,126,0.18)] px-6 py-12 text-center">
              <p className="theme-muted-page">
                {categories.length === 0 ? site.emptyCatalogMessage : "No category matches that search."}
              </p>
            </div>
          )}
        </div>
      </Center>
    </>
  );
}
