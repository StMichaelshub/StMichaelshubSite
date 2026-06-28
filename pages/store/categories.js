import SiteCategoriesPage from "@/components/SiteCategoriesPage";
import { PUBLIC_SITE_KEYS, getPublicSiteConfig } from "@/lib/publicSite";
import { getStorefrontProducts } from "@/lib/storefrontCatalog";

export default function StoreCategoriesPage(props) {
  return <SiteCategoriesPage {...props} />;
}

export async function getServerSideProps() {
  try {
    const siteKey = PUBLIC_SITE_KEYS.STORE;
    const plainProducts = await getStorefrontProducts({ site: siteKey });

    const productsByCategory = {};
    for (const product of plainProducts) {
      const categoryName = product.categoryName || product.category || "Uncategorized";
      if (!productsByCategory[categoryName]) {
        productsByCategory[categoryName] = [];
      }
      productsByCategory[categoryName].push(product);
    }

    return {
      props: {
        site: getPublicSiteConfig(siteKey),
        categories: Object.keys(productsByCategory),
        productsByCategory: JSON.parse(JSON.stringify(productsByCategory)),
      },
    };
  } catch (error) {
    console.error("Store categories page SSR error:", error);
    return {
      props: {
        site: getPublicSiteConfig(PUBLIC_SITE_KEYS.STORE),
        categories: [],
        productsByCategory: {},
      },
    };
  }
}