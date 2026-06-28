import HotelRoomsPage from "@/components/HotelRoomsPage";
import { isHotelRoomProduct } from "@/lib/hotelCatalog";
import { resolveHotelCatalogSections } from "@/lib/hotelStorefront";
import { PUBLIC_SITE_KEYS, getPublicSiteConfig } from "@/lib/publicSite";
import { getStorefrontProducts } from "@/lib/storefrontCatalog";

export default function HotelRoomsRoute(props) {
  return <HotelRoomsPage {...props} />;
}

export async function getServerSideProps() {
  try {
    const siteKey = PUBLIC_SITE_KEYS.HOTEL;
    const products = await getStorefrontProducts({ site: siteKey });
    const sections = resolveHotelCatalogSections(products);
    const rooms = sections.rooms.filter(isHotelRoomProduct);

    return {
      props: {
        site: getPublicSiteConfig(siteKey),
        rooms: JSON.parse(JSON.stringify(rooms)),
      },
    };
  } catch (error) {
    console.error("Hotel rooms page SSR error:", error);
    return {
      props: {
        site: getPublicSiteConfig(PUBLIC_SITE_KEYS.HOTEL),
        rooms: [],
      },
    };
  }
}