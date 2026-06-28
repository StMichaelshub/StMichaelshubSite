import HotelLandingPage from "@/components/HotelHomePage";
import { resolveHotelCatalogSections } from "@/lib/hotelStorefront";
import { PUBLIC_SITE_KEYS, getPublicSiteConfig } from "@/lib/publicSite";
import { getStorefrontProducts } from "@/lib/storefrontCatalog";
import { getHeroContentForSite } from "@/lib/heroContent";

export default function HotelHomePage(props) {
  return <HotelLandingPage {...props} />;
}

export async function getServerSideProps() {
  try {
    const siteKey = PUBLIC_SITE_KEYS.HOTEL;
    const [resolvedProducts, heroContent] = await Promise.all([
      getStorefrontProducts({ limit: 12, site: siteKey }),
      getHeroContentForSite(siteKey),
    ]);
    const sections = resolveHotelCatalogSections(resolvedProducts);
    const featuredRoom = sections.featuredRoom;

    return {
      props: {
        site: getPublicSiteConfig(siteKey),
        featuredRoom: JSON.parse(JSON.stringify(featuredRoom)),
        rooms: JSON.parse(JSON.stringify(sections.rooms)),
        dining: JSON.parse(JSON.stringify(sections.dining)),
        sections: JSON.parse(JSON.stringify(sections)),
        heroContent,
      },
    };
  } catch (error) {
    console.error("Hotel home page SSR error:", error);
    return {
      props: {
        site: getPublicSiteConfig(PUBLIC_SITE_KEYS.HOTEL),
        featuredRoom: null,
        rooms: [],
        dining: [],
        sections: resolveHotelCatalogSections([]),
        heroContent: { activeHero: null, secondaryHeroes: [], socialLinks: [] },
      },
    };
  }
}