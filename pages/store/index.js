import SiteHomePage from "@/components/SiteHomePage";
import { getCatalogInsights } from "@/lib/storefront";
import { PUBLIC_SITE_KEYS, getPublicSiteConfig } from "@/lib/publicSite";
import { getStorefrontProductById, getStorefrontProducts } from "@/lib/storefrontCatalog";
import { getHeroContentForSite } from "@/lib/heroContent";

export default function StoreHomePage(props) {
  return <SiteHomePage {...props} />;
}

export async function getServerSideProps() {
  try {
    const siteKey = PUBLIC_SITE_KEYS.STORE;
    const featuredProductId = process.env.FEATURED_PRODUCT_ID;
    const [resolvedFeaturedProduct, resolvedNewProducts, heroContent] = await Promise.all([
      getStorefrontProductById(featuredProductId, { fallbackToLatest: true, site: siteKey }),
      getStorefrontProducts({ limit: 12, site: siteKey }),
      getHeroContentForSite(siteKey),
    ]);
    const catalogInsights = getCatalogInsights(resolvedNewProducts);

    return {
      props: {
        site: getPublicSiteConfig(siteKey),
        featuredProduct: JSON.parse(JSON.stringify(resolvedFeaturedProduct)),
        newProducts: JSON.parse(JSON.stringify(resolvedNewProducts)),
        catalogInsights,
        heroContent,
      },
    };
  } catch (error) {
    console.error("Store home page SSR error:", error);
    return {
      props: {
        site: getPublicSiteConfig(PUBLIC_SITE_KEYS.STORE),
        featuredProduct: null,
        newProducts: [],
        catalogInsights: getCatalogInsights([]),
        heroContent: { activeHero: null, secondaryHeroes: [], socialLinks: [] },
      },
    };
  }
}