import Head from "next/head";
import Center from "@/components/Center";
import Header from "@/components/Header";
import HotelBookingForm from "@/components/HotelBookingForm";
import { resolveHotelCatalogSections } from "@/lib/hotelStorefront";
import { PUBLIC_SITE_KEYS, getPublicSiteConfig } from "@/lib/publicSite";
import { getStorefrontProducts } from "@/lib/storefrontCatalog";

export default function HotelBookingPage({ site, rooms }) {
  return (
    <>
      <Head>
        <title>{`Book a Stay | ${site.displayName}`}</title>
      </Head>
      <Header siteKey={site.key} />
      <Center>
        <div className="hotel-page min-h-screen px-4 py-8 sm:px-8 sm:py-10">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <section className="hotel-shell rounded-[2rem] p-6 md:p-8">
              <span className="hotel-shell-kicker inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] shadow-sm">
                Direct reservations
              </span>
              <h1 className="mt-4 text-3xl font-bold text-[#fff1dc] sm:text-4xl">Request your room directly</h1>
              <p className="hotel-shell-muted mt-3 text-base leading-8">
                The hotel side now runs as a direct booking experience. Choose a room type, select your dates, and send the request to the reservations desk without using a cart or stock-managed checkout.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  "Room-first reservation flow",
                  "Arrival coordination support",
                  "Email confirmation to guest and hotel",
                  "Lounge and contact follow-up handled directly",
                ].map((item) => (
                  <div key={item} className="hotel-shell-card rounded-[1.3rem] px-4 py-4 text-sm font-semibold text-[#fff1dc]">
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <HotelBookingForm rooms={rooms} />
          </div>
        </div>
      </Center>
    </>
  );
}

export async function getServerSideProps() {
  try {
    const siteKey = PUBLIC_SITE_KEYS.HOTEL;
    const products = await getStorefrontProducts({ site: siteKey });
    const sections = resolveHotelCatalogSections(products);

    return {
      props: {
        site: getPublicSiteConfig(siteKey),
        rooms: JSON.parse(JSON.stringify(sections.rooms)),
      },
    };
  } catch (error) {
    console.error("Hotel booking page SSR error:", error);
    return {
      props: {
        site: getPublicSiteConfig(PUBLIC_SITE_KEYS.HOTEL),
        rooms: [],
      },
    };
  }
}