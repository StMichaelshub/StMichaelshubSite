import Head from "next/head";
import Center from "@/components/Center";
import Header from "@/components/Header";
import ProductBox from "@/components/ProductBox";
import { getCatalogInsights } from "@/lib/storefront";
import Link from "next/link";
import { useRouter } from "next/router";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { getPublicSitePath } from "@/lib/publicSite";
import { promotionAppliesToProduct } from "@/lib/promotionFilters";

const SORT_OPTIONS = new Set(["featured", "price-asc", "price-desc", "name"]);

function readQueryValue(value) {
  return typeof value === "string" ? value : "";
}

export default function SiteProductsPage({ site, products, activePromotions = [] }) {
  const router = useRouter();
  const [query, setQuery] = useState(() => readQueryValue(router.query.q));
  const [categoryFilter, setCategoryFilter] = useState(() => {
    const initialCategory = readQueryValue(router.query.category);
    return initialCategory || "all";
  });
  const [promotionFilter, setPromotionFilter] = useState(() => readQueryValue(router.query.promotion));
  const [sortBy, setSortBy] = useState(() => {
    const initialSort = readQueryValue(router.query.sort);
    return SORT_OPTIONS.has(initialSort) ? initialSort : "featured";
  });
  const deferredQuery = useDeferredValue(query);

  const categories = useMemo(
    () => [...new Set((products || []).map((product) => product.categoryName || product.category).filter(Boolean))],
    [products]
  );
  const catalogInsights = getCatalogInsights(products || []);
  const normalizedCategoryFilter = categories.includes(categoryFilter) ? categoryFilter : "all";
  const normalizedSortBy = SORT_OPTIONS.has(sortBy) ? sortBy : "featured";
  const selectedPromotion = (activePromotions || []).find((promotion) => promotion._id === promotionFilter) || null;
  const normalizedPromotionFilter = selectedPromotion ? promotionFilter : "";
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const isHotelSite = site?.key === "hotel";
  const storeInputClassName = "rounded-[1.1rem] border border-[rgba(31,44,51,0.12)] bg-white/84 px-4 py-3 text-sm text-[var(--foreground-strong)] outline-none transition focus:border-[rgba(176,114,42,0.38)] focus:ring-4 focus:ring-[rgba(176,114,42,0.1)]";

  const filteredProducts = (products || [])
    .filter((product) => {
      const matchesCategory =
        normalizedCategoryFilter === "all" ||
        (product.categoryName || product.category || "") === normalizedCategoryFilter;

      const haystack = [product.name, product.description, product.categoryName, product.category]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
      const matchesPromotion = !selectedPromotion || promotionAppliesToProduct(selectedPromotion, product);
      return matchesCategory && matchesQuery && matchesPromotion;
    })
    .sort((leftProduct, rightProduct) => {
      if (normalizedSortBy === "price-asc") {
        return (leftProduct.salePriceIncTax || 0) - (rightProduct.salePriceIncTax || 0);
      }
      if (normalizedSortBy === "price-desc") {
        return (rightProduct.salePriceIncTax || 0) - (leftProduct.salePriceIncTax || 0);
      }
      if (normalizedSortBy === "name") {
        return (leftProduct.name || "").localeCompare(rightProduct.name || "");
      }

      return new Date(rightProduct.createdAt || 0) - new Date(leftProduct.createdAt || 0);
    });

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const nextQuery = {};
    const trimmedQuery = query.trim();

    if (trimmedQuery) {
      nextQuery.q = trimmedQuery;
    }

    if (normalizedCategoryFilter !== "all") {
      nextQuery.category = normalizedCategoryFilter;
    }

    if (normalizedSortBy !== "featured") {
      nextQuery.sort = normalizedSortBy;
    }

    if (normalizedPromotionFilter) {
      nextQuery.promotion = normalizedPromotionFilter;
    }

    if (
      readQueryValue(router.query.q) === (nextQuery.q || "") &&
      readQueryValue(router.query.category) === (nextQuery.category || "") &&
      readQueryValue(router.query.sort) === (nextQuery.sort || "") &&
      readQueryValue(router.query.promotion) === (nextQuery.promotion || "")
    ) {
      return;
    }

    router.replace(
      {
        pathname: router.pathname,
        query: nextQuery,
      },
      undefined,
      { shallow: true, scroll: false }
    );
  }, [normalizedCategoryFilter, normalizedPromotionFilter, normalizedSortBy, query, router]);

  const hasActiveFilters =
    Boolean(query.trim()) || normalizedCategoryFilter !== "all" || normalizedPromotionFilter || normalizedSortBy !== "featured";

  const resetFilters = () => {
    setQuery("");
    setCategoryFilter("all");
    setPromotionFilter("");
    setSortBy("featured");
  };

  if (!isHotelSite) {
    const categoryChips = ["all", ...categories];
    const selectClassName = `${storeInputClassName} py-2.5`;

    return (
      <>
        <Head>
          <title>{`${site.listingTitle} | ${site.displayName}`}</title>
        </Head>
        <Header siteKey={site.key} />
        <Center>
          <div className="min-h-screen px-3 py-6 sm:px-8 sm:py-8">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-extrabold text-[var(--foreground-strong)] sm:text-4xl">
                  {normalizedCategoryFilter === "all" ? "All products" : normalizedCategoryFilter}
                </h1>
                <p className="mt-1 text-sm store-shell-muted">
                  {filteredProducts.length} of {catalogInsights.productCount} product{catalogInsights.productCount === 1 ? "" : "s"}
                  {query.trim() ? ` matching “${query.trim()}”` : ""}
                </p>
              </div>
              <Link href={getPublicSitePath(site.key, "/categories")} className="text-sm font-semibold text-[#8d5a1f] hover:underline">
                Browse by category →
              </Link>
            </div>

            {/* One filter bar: search, categories, sort. Stays in view while scrolling. */}
            <div className="store-shell-card z-[40] mt-5 rounded-[1.25rem] p-3 backdrop-blur sm:p-4 md:sticky md:top-[6.75rem]">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <label className="sr-only" htmlFor="product-search">Search products</label>
                <input
                  id="product-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={`Search ${site.shortLabel.toLowerCase()} products`}
                  className={`${storeInputClassName} w-full lg:max-w-sm`}
                />
                <div className="flex gap-2">
                  {activePromotions.length > 0 ? (
                    <select
                      aria-label="Promotion"
                      value={normalizedPromotionFilter}
                      onChange={(event) => setPromotionFilter(event.target.value)}
                      className={`${selectClassName} min-w-0 flex-1`}
                    >
                      <option value="">All offers</option>
                      {activePromotions.map((promotion) => (
                        <option key={promotion._id} value={promotion._id}>
                          {promotion.name}
                        </option>
                      ))}
                    </select>
                  ) : null}
                  <select
                    aria-label="Sort products"
                    value={normalizedSortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                    className={`${selectClassName} min-w-0 flex-1 lg:flex-none`}
                  >
                    <option value="featured">Newest first</option>
                    <option value="price-asc">Price: low to high</option>
                    <option value="price-desc">Price: high to low</option>
                    <option value="name">Name A–Z</option>
                  </select>
                </div>
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-sm font-semibold text-[#8d5a1f] hover:underline lg:ml-auto"
                  >
                    Clear filters
                  </button>
                ) : null}
              </div>

              {categories.length > 0 ? (
                <div className="chip-scroll mt-3 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Categories">
                  {categoryChips.map((category) => {
                    const isSelected = normalizedCategoryFilter === category;
                    return (
                      <button
                        key={category}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setCategoryFilter(category)}
                        className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                          isSelected ? "store-button-accent" : "store-button-secondary"
                        }`}
                      >
                        {category === "all" ? "All" : category}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <ProductBox key={product._id} {...product} siteKey={site.key} />
                ))
              ) : (
                <div className="store-shell-card col-span-full rounded-[1.5rem] px-6 py-12 text-center">
                  <p className="text-lg font-semibold text-[var(--foreground-strong)]">
                    {(products || []).length === 0 ? site.emptyCatalogMessage : "No products match your search."}
                  </p>
                  {hasActiveFilters ? (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="store-button-accent mt-5 rounded-full px-5 py-3 text-sm font-semibold"
                    >
                      Clear filters
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </Center>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{`${site.listingTitle} | ${site.displayName}`}</title>
      </Head>
      <Header siteKey={site.key} />
      <Center>
        <div className="min-h-screen px-3 py-6 sm:px-8 sm:py-8">
          <div className="theme-shell-light rounded-[1.75rem] p-4 sm:rounded-[2rem] sm:p-8">
            <div className="flex flex-col gap-6 border-b border-[rgba(20,109,126,0.12)] pb-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <span className="theme-tag inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] shadow-sm">
                  {site.listingEyebrow}
                </span>
                <h1 className="mb-2 mt-4 text-2xl font-extrabold text-[var(--foreground-strong)] sm:text-3xl">
                  {site.listingTitle}
                </h1>
                <p className="max-w-2xl theme-muted-page">{site.listingDescription}</p>
              </div>
              <div className="theme-card-light rounded-2xl px-4 py-3 text-sm font-semibold text-[var(--foreground-strong)] shadow-sm">
                {filteredProducts.length} result{filteredProducts.length === 1 ? "" : "s"}
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="theme-card-light rounded-[1.5rem] px-5 py-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-[rgba(18,52,60,0.52)]">Catalog total</p>
                <p className="mt-2 text-3xl font-bold text-[var(--foreground-strong)]">{catalogInsights.productCount}</p>
              </div>
              <div className="theme-card-light rounded-[1.5rem] px-5 py-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-[rgba(18,52,60,0.52)]">Available now</p>
                <p className="mt-2 text-3xl font-bold text-[var(--foreground-strong)]">{catalogInsights.availableCount}</p>
              </div>
              <div className="theme-card-light rounded-[1.5rem] px-5 py-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-[rgba(18,52,60,0.52)]">Price range</p>
                <p className="mt-2 text-3xl font-bold text-[var(--foreground-strong)]">₦{catalogInsights.minPrice.toLocaleString()}</p>
                <p className="mt-1 text-sm theme-muted-page">Up to ₦{catalogInsights.maxPrice.toLocaleString()}</p>
              </div>
            </div>

            <div className="theme-card-light mt-6 grid gap-3 rounded-[1.5rem] p-3 shadow-sm sm:gap-4 sm:p-4 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search ${site.shortLabel.toLowerCase()} products, categories, and keywords`}
                className="theme-input-light rounded-2xl px-4 py-3 outline-none"
              />
              <select
                value={normalizedCategoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="theme-input-light rounded-2xl px-4 py-3 outline-none"
              >
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <select
                value={normalizedPromotionFilter}
                onChange={(event) => setPromotionFilter(event.target.value)}
                className="theme-input-light rounded-2xl px-4 py-3 outline-none"
              >
                <option value="">All promotions</option>
                {activePromotions.map((promotion) => (
                  <option key={promotion._id} value={promotion._id}>
                    {promotion.name}
                  </option>
                ))}
              </select>
              <select
                value={normalizedSortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="theme-input-light rounded-2xl px-4 py-3 outline-none"
              >
                <option value="featured">Newest first</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="name">Name</option>
              </select>
            </div>

            <div className="mt-6 flex gap-3 overflow-x-auto pb-1 sm:flex-wrap">
              <button
                type="button"
                onClick={() => setCategoryFilter("all")}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                  normalizedCategoryFilter === "all"
                    ? "theme-button-accent"
                    : "theme-card-light text-[var(--foreground-strong)]"
                }`}
              >
                All categories
              </button>
              {catalogInsights.topCategories.map((category) => (
                <button
                  key={category.name}
                  type="button"
                  onClick={() => setCategoryFilter(category.name)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                    normalizedCategoryFilter === category.name
                      ? "theme-button-accent"
                      : "theme-card-light text-[var(--foreground-strong)]"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              {hasActiveFilters ? (
                <>
                  <div className="theme-card-light inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-[var(--foreground-strong)] shadow-sm">
                    <span className="font-semibold">View</span>
                    <span>
                      {normalizedCategoryFilter === "all" ? "All categories" : normalizedCategoryFilter}
                      {selectedPromotion ? ` / ${selectedPromotion.name}` : ""}
                      {query.trim() ? ` · “${query.trim()}”` : ""}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="theme-button-secondary rounded-full px-4 py-2 text-sm font-medium"
                  >
                    Reset filters
                  </button>
                </>
              ) : (
                <p className="text-sm theme-muted-page">
                  Search or browse categories to narrow the catalog.
                </p>
              )}
              <Link
                href={getPublicSitePath(site.key, "/categories")}
                className="theme-card-light rounded-full px-4 py-2 text-sm font-medium text-[var(--foreground-strong)] shadow-sm"
              >
                Browse categories
              </Link>
            </div>

            <div className="max-w-7xl mx-auto px-1 py-8 sm:px-4 sm:py-12">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-6">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <div key={product._id}>
                      <ProductBox {...product} siteKey={site.key} />
                    </div>
                  ))
                ) : (
                  <div className="col-span-full rounded-[1.5rem] border border-dashed border-[rgba(20,109,126,0.18)] px-6 py-12 text-center">
                    <p className="theme-muted-page">{site.emptyCatalogMessage}</p>
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="theme-button-accent mt-5 rounded-full px-5 py-3 text-sm font-semibold"
                    >
                      Clear filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Center>
    </>
  );
}