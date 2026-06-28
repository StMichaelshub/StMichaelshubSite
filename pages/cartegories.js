import Head from "next/head";
import Center from "@/components/Center";
import Header from "@/components/Header";
import ProductBox from "@/components/ProductBox";
import { useDeferredValue, useState } from "react";
import { getStorefrontProducts } from "@/lib/storefrontCatalog";
import Link from "next/link";

export default function CategoriesPage({ categories, productsByCategory }) {
  const [activeCategory, setActiveCategory] = useState(null);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const totalProducts = Object.values(productsByCategory).reduce(
    (runningTotal, products) => runningTotal + products.length,
    0
  );

  const categoryCards = categories.map((category) => ({
    name: category,
    count: productsByCategory[category]?.length || 0,
  }));

  const displayCategories = activeCategory
    ? { [activeCategory]: productsByCategory[activeCategory] }
    : productsByCategory;

  const filteredCategories = Object.entries(displayCategories).reduce(
    (accumulator, [category, products]) => {
      const filteredProducts = products.filter((product) => {
        if (!normalizedQuery) {
          return true;
        }

        const haystack = [product.name, product.description, category]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedQuery);
      });

      if (filteredProducts.length) {
        accumulator[category] = filteredProducts;
      }

      return accumulator;
    },
    {}
  );

  return (
    <>
      <Head>
        <title>Categories | St Michael&apos;s Store</title>
      </Head>
      <Header />
      <Center>
        <div className="min-h-screen py-8 px-4 sm:px-8">
          <div className="theme-shell-light rounded-[2rem] p-8">
            <div className="border-b border-[rgba(20,109,126,0.12)] pb-6">
              <span className="theme-tag inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] shadow-sm">
                Guided browsing
              </span>
              <h1 className="mb-3 mt-4 text-3xl font-extrabold text-[var(--foreground-strong)]">
                Shop by Category
              </h1>
              <p className="max-w-2xl theme-muted-page">
                Jump into a category, narrow results with live search, and move directly into a filtered catalog view.
              </p>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
              <div className="theme-card-light rounded-[1.5rem] p-4 shadow-sm">
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search inside categories"
                  className="theme-input-light w-full rounded-2xl px-4 py-3 outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                <div className="theme-card-light rounded-[1.5rem] px-5 py-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.22em] text-[rgba(18,52,60,0.52)]">Categories</p>
                  <p className="mt-2 text-3xl font-bold text-[var(--foreground-strong)]">{categories.length}</p>
                </div>
                <div className="theme-card-light rounded-[1.5rem] px-5 py-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.22em] text-[rgba(18,52,60,0.52)]">Products</p>
                  <p className="mt-2 text-3xl font-bold text-[var(--foreground-strong)]">{totalProducts}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {categoryCards.map((category) => (
                <button
                  key={category.name}
                  onClick={() =>
                    setActiveCategory((currentValue) =>
                      currentValue === category.name ? null : category.name
                    )
                  }
                  className={`rounded-[1.5rem] border px-5 py-5 text-left transition ${
                    activeCategory === category.name
                      ? "border-[rgba(216,172,79,0.38)] bg-[rgba(216,172,79,0.12)] shadow-[0_18px_36px_rgba(186,132,24,0.14)]"
                      : "theme-card-light"
                  }`}
                >
                  <p className="text-xs uppercase tracking-[0.22em] text-[rgba(18,52,60,0.52)]">Category</p>
                  <p className="mt-2 text-2xl font-bold text-[var(--foreground-strong)]">{category.name}</p>
                  <div className="mt-4 flex items-center justify-between gap-3 text-sm theme-muted-page">
                    <span>{category.count} product{category.count === 1 ? "" : "s"}</span>
                    <span>{activeCategory === category.name ? "Selected" : "Browse"}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="mb-8 mt-8 flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCategory(null)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeCategory === null ? "theme-button-accent" : "theme-card-light text-[var(--foreground-strong)]"
                }`}
              >
                All categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    activeCategory === cat ? "theme-button-accent" : "theme-card-light text-[var(--foreground-strong)]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {Object.entries(filteredCategories).map(([category, products]) => (
              <div key={category} className="mb-10">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-[var(--foreground-strong)]">{category}</h2>
                    <p className="mt-1 text-sm theme-muted-page">
                      {products.length} product{products.length === 1 ? "" : "s"} in this selection
                    </p>
                  </div>
                  <Link
                    href={{ pathname: "/products", query: { category } }}
                    className="theme-card-light inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium text-[var(--foreground-strong)] shadow-sm"
                  >
                    Open filtered catalog
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-6">
                  {products.map((product) => (
                    <div key={product._id}>
                      <ProductBox {...product} />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {Object.keys(filteredCategories).length === 0 && (
              <div className="rounded-[1.5rem] border border-dashed border-[rgba(20,109,126,0.18)] px-6 py-12 text-center">
                <p className="theme-muted-page">No products match the current category filter.</p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory(null);
                    setQuery("");
                  }}
                  className="theme-button-accent mt-5 rounded-full px-5 py-3 text-sm font-semibold"
                >
                  Reset category view
                </button>
              </div>
            )}
          </div>
        </div>
      </Center>
    </>
  );
}

export async function getServerSideProps() {
  try {
    const plainProducts = await getStorefrontProducts();

    const productsByCategory = {};
    for (const product of plainProducts) {
      const cat = product.categoryName || product.category || "Uncategorized";
      if (!productsByCategory[cat]) productsByCategory[cat] = [];
      productsByCategory[cat].push(product);
    }

    return {
      props: {
        categories: Object.keys(productsByCategory),
        productsByCategory,
      },
    };
  } catch (error) {
    console.error("Categories page SSR error:", error);
    return {
      props: {
        categories: [],
        productsByCategory: {},
      },
    };
  }
}
