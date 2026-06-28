import SiteProductsPage from "@/components/SiteProductsPage";
import { getStorefrontProducts } from "@/lib/storefrontCatalog";
import { PUBLIC_SITE_KEYS, getPublicSiteConfig } from "@/lib/publicSite";
import { getActivePublicPromotions } from "@/lib/promotionContent";

export default function ProductsPage(props) {
  return <SiteProductsPage {...props} />;
}

export async function getServerSideProps() {
  try {
    const siteKey = PUBLIC_SITE_KEYS.STORE;
    const [resolvedProducts, activePromotions] = await Promise.all([
      getStorefrontProducts({ site: siteKey }),
      getActivePublicPromotions(),
    ]);
    return {
      props: {
        site: getPublicSiteConfig(siteKey),
        products: JSON.parse(JSON.stringify(resolvedProducts)),
        activePromotions,
      },
    };
  } catch (error) {
    console.error("Products page SSR error:", error);
    return {
      props: {
        site: getPublicSiteConfig(PUBLIC_SITE_KEYS.STORE),
        products: [],
        activePromotions: [],
      },
    };
  }
}
