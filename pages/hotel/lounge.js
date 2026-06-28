import HotelLoungePage from "@/components/HotelLoungePage";
import { resolveHotelCatalogSections } from "@/lib/hotelStorefront";
import { PUBLIC_SITE_KEYS, getPublicSiteConfig } from "@/lib/publicSite";
import { getStorefrontProducts } from "@/lib/storefrontCatalog";

export default function HotelLoungeRoute(props) {
  return <HotelLoungePage {...props} />;
}

export async function getServerSideProps() {
  try {
    const siteKey = PUBLIC_SITE_KEYS.HOTEL;
    const products = await getStorefrontProducts({ site: siteKey });
    const sections = resolveHotelCatalogSections(products);

    return {
      props: {
        site: getPublicSiteConfig(siteKey),
        dining: JSON.parse(JSON.stringify(sections.dining)),
      },
    };
  } catch (error) {
    console.error("Hotel lounge page SSR error:", error);
    return {
      props: {
        site: getPublicSiteConfig(PUBLIC_SITE_KEYS.HOTEL),
        dining: [],
      },
    };
  }
}