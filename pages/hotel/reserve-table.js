import Head from "next/head";
import Center from "@/components/Center";
import Header from "@/components/Header";
import HotelTableReservationForm from "@/components/HotelTableReservationForm";
import { PUBLIC_SITE_KEYS, getPublicSiteConfig } from "@/lib/publicSite";

export default function HotelReserveTablePage({ site }) {
  return (
    <>
      <Head>
        <title>{`Reserve a Table | ${site.displayName}`}</title>
      </Head>
      <Header siteKey={site.key} />
      <Center>
        <div className="hotel-page min-h-screen px-4 py-8 sm:px-8 sm:py-10">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <section className="hotel-shell rounded-[2rem] p-6 md:p-8">
              <span className="hotel-shell-kicker inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] shadow-sm">
                Lounge booking
              </span>
              <h1 className="mt-4 text-3xl font-bold text-[#fff1dc] sm:text-4xl">Reserve your lounge table</h1>
              <p className="hotel-shell-muted mt-3 text-base leading-8">
                Request a table for dining, drinks, or a private guest meeting. The hotel team will confirm your reservation directly with you.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  "Direct lounge reservation requests",
                  "Party-size and timing coordination",
                  "Special occasion notes and seating preferences",
                  "Managed separately from room stays",
                ].map((item) => (
                  <div key={item} className="hotel-shell-card rounded-[1.3rem] px-4 py-4 text-sm font-semibold text-[#fff1dc]">
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <HotelTableReservationForm />
          </div>
        </div>
      </Center>
    </>
  );
}

export async function getServerSideProps() {
  return {
    props: {
      site: getPublicSiteConfig(PUBLIC_SITE_KEYS.HOTEL),
    },
  };
}