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
    return (
      <>
        <Head>
          <title>{`${site.listingTitle} | ${site.displayName}`}</title>
        </Head>
        <Header siteKey={site.key} />
        <Center>
          <div className="min-h-screen px-3 py-6 sm:px-8 sm:py-8">
            <div className="store-shell rounded-[2rem] px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
              <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
                <aside className="space-y-5">
                  <div className="store-shell-card rounded-[1.6rem] p-5 sm:p-6">
                    <span className="store-tag inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em]">
                      {site.listingEyebrow}
                    </span>
                    <h1 className="mt-4 text-3xl font-extrabold text-[var(--foreground-strong)] sm:text-[2.4rem]">
                      {site.listingTitle}
                    </h1>
                    <p className="mt-3 text-base leading-8 store-shell-muted">
                      {site.listingDescription}
                    </p>
                  </div>

                  <div className="store-shell-card rounded-[1.6rem] p-5 sm:p-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[rgba(18,52,60,0.5)]">
                          Search catalog
                        </label>
                        <input
                          type="search"
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                          placeholder={`Search ${site.shortLabel.toLowerCase()} products, categories, and keywords`}
                          className={`${storeInputClassName} mt-2 w-full`}
                        />
                      </div>

                      <div>
                        <label className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[rgba(18,52,60,0.5)]">
                          Category
                        </label>
                        <select
                          value={normalizedCategoryFilter}
                          onChange={(event) => setCategoryFilter(event.target.value)}
                          className={`${storeInputClassName} mt-2 w-full`}
                        >
                          <option value="all">All categories</option>
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>

                      {activePromotions.length > 0 ? (
                        <div>
                          <label className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[rgba(18,52,60,0.5)]">
                            Promotion
                          </label>
                          <select
                            value={normalizedPromotionFilter}
                            onChange={(event) => setPromotionFilter(event.target.value)}
                            className={`${storeInputClassName} mt-2 w-full`}
                          >
                            <option value="">All promotions</option>
                            {activePromotions.map((promotion) => (
                              <option key={promotion._id} value={promotion._id}>
                                {promotion.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : null}

                      <div>
                        <label className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[rgba(18,52,60,0.5)]">
                          Sort order
                        </label>
                        <select
                          value={normalizedSortBy}
                          onChange={(event) => setSortBy(event.target.value)}
                          className={`${storeInputClassName} mt-2 w-full`}
                        >
                          <option value="featured">Newest first</option>
                          <option value="price-asc">Price: low to high</option>
                          <option value="price-desc">Price: high to low</option>
                          <option value="name">Name</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link
                        href={getPublicSitePath(site.key, "/categories")}
                        className="store-button-secondary inline-flex min-h-[3rem] items-center justify-center rounded-[1rem] px-4 py-3 text-sm font-semibold"
                      >
                        Guided category browser
                      </Link>
                      {hasActiveFilters ? (
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="store-button-accent inline-flex min-h-[3rem] items-center justify-center rounded-[1rem] px-4 py-3 text-sm font-semibold"
                        >
                          Reset view
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <div className="store-shell-card rounded-[1.35rem] px-4 py-4">
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[rgba(18,52,60,0.48)]">Products</p>
                      <p className="mt-2 text-3xl font-bold text-[var(--foreground-strong)]">{catalogInsights.productCount}</p>
                    </div>
                    <div className="store-shell-card rounded-[1.35rem] px-4 py-4">
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[rgba(18,52,60,0.48)]">Available</p>
                      <p className="mt-2 text-3xl font-bold text-[var(--foreground-strong)]">{catalogInsights.availableCount}</p>
                    </div>
                  </div>

                  <div className="store-shell-card rounded-[1.6rem] p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-3 border-b border-[rgba(31,44,51,0.08)] pb-3">
                      <p className="text-sm font-semibold text-[var(--foreground-strong)]">Quick category routes</p>
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(18,52,60,0.46)]">Most active</span>
                    </div>
                    <div className="mt-4 grid gap-3">
                      <button
                        type="button"
                        onClick={() => setCategoryFilter("all")}
                        className={`flex items-center justify-between rounded-[1.1rem] px-4 py-3 text-sm font-medium transition ${
                          normalizedCategoryFilter === "all"
                            ? "store-button-accent"
                            : "store-button-secondary"
                        }`}
                      >
                        <span>All categories</span>
                        <span className="rounded-full bg-[rgba(31,44,51,0.08)] px-2.5 py-1 text-xs font-semibold text-[rgba(18,52,60,0.72)]">
                          {catalogInsights.productCount}
                        </span>
                      </button>
                      {catalogInsights.topCategories.map((category) => (
                        <button
                          key={category.name}
                          type="button"
                          onClick={() => setCategoryFilter(category.name)}
                          className={`flex items-center justify-between rounded-[1.1rem] px-4 py-3 text-sm font-medium transition ${
                            normalizedCategoryFilter === category.name
                              ? "store-button-accent"
                              : "store-button-secondary"
                          }`}
                        >
                          <span>
                            <span className="block text-left font-semibold">{category.name}</span>
                            <span className="mt-1 block text-left text-xs text-[rgba(18,52,60,0.56)]">{category.availableCount} available now</span>
                          </span>
                          <span className="rounded-full bg-[rgba(31,44,51,0.08)] px-2.5 py-1 text-xs font-semibold text-[rgba(18,52,60,0.72)]">
                            {category.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </aside>

                <div className="space-y-5">
                  <div className="store-shell-card rounded-[1.6rem] p-5 sm:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[rgba(18,52,60,0.48)]">Current view</p>
                        <h2 className="mt-2 text-2xl font-bold text-[var(--foreground-strong)] sm:text-[2rem]">
                          {filteredProducts.length} result{filteredProducts.length === 1 ? "" : "s"}
                        </h2>
                      </div>

                      <div className="store-button-secondary inline-flex min-h-[3rem] items-center rounded-[1rem] px-4 py-3 text-sm font-semibold">
                        {catalogInsights.productCount} total
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setCategoryFilter("all")}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                          normalizedCategoryFilter === "all"
                            ? "store-button-accent"
                            : "store-button-secondary"
                        }`}
                      >
                        All categories
                      </button>
                      {catalogInsights.topCategories.map((category) => (
                        <button
                          key={category.name}
                          type="button"
                          onClick={() => setCategoryFilter(category.name)}
                          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                            normalizedCategoryFilter === category.name
                              ? "store-button-accent"
                              : "store-button-secondary"
                          }`}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                      {hasActiveFilters ? (
                        <>
                          <div className="store-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm">
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
                            className="store-button-accent rounded-full px-4 py-2 text-sm font-semibold"
                          >
                            Clear filters
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => (
                        <div key={product._id}>
                          <ProductBox {...product} siteKey={site.key} />
                        </div>
                      ))
                    ) : (
                      <div className="store-shell-card col-span-full rounded-[1.6rem] px-6 py-12 text-center">
                        <p className="theme-muted-page">{site.emptyCatalogMessage}</p>
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="store-button-accent mt-5 rounded-full px-5 py-3 text-sm font-semibold"
                        >
                          Clear filters
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
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