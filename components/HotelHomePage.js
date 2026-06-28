import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import Center from "@/components/Center";
import Header from "@/components/Header";
import HotelRoomCard from "@/components/HotelRoomCard";
import HotelDiningCard from "@/components/HotelDiningCard";
import { getPrimaryProductImage, PRODUCT_IMAGE_PLACEHOLDER } from "@/lib/productImages";
import { PUBLIC_SITE_KEYS, getPublicSitePath } from "@/lib/publicSite";

export default function HotelHomePage({ site, rooms, dining, featuredRoom, sections, heroContent }) {
  const previewRooms = (rooms || []).slice(0, 3);
  const previewDining = (dining || []).slice(0, 3);
  const activeHero = heroContent?.activeHero || null;
  const fallbackHeroImage = featuredRoom ? getPrimaryProductImage(featuredRoom.images) : PRODUCT_IMAGE_PLACEHOLDER;
  const heroImage = activeHero?.bgImage?.[0]?.full || activeHero?.image?.[0]?.full || fallbackHeroImage;
  const heroTitle = activeHero?.title || site.heroTitle;
  const heroDescription = activeHero?.subtitle || "Discover a slower, more polished hotel experience with quiet room choices, direct reservations, and lounge moments that read like hospitality instead of ecommerce.";
  const heroCtaHref = activeHero?.ctaLink || getPublicSitePath(PUBLIC_SITE_KEYS.HOTEL, "/rooms");
  const heroCtaLabel = activeHero?.ctaText || "Explore rooms";

  return (
    <>
      <Head>
        <title>{`${site.displayName} | St Michael's`}</title>
        <meta name="description" content={site.heroDescription} />
      </Head>
      <Header siteKey={site.key} />
      <div className="hotel-page px-4 py-8 sm:px-8 lg:py-10">
        <Center>
          <section className="hotel-shell rounded-[2rem] px-6 py-8 md:px-10 md:py-12">
            <div className="relative grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <span className="hotel-shell-kicker inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] shadow-sm">
                  {site.heroEyebrow}
                </span>
                <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.02] text-[#fff3df] lg:text-6xl">
                  {heroTitle}
                </h1>
                <p className="hotel-shell-muted mt-5 max-w-2xl text-base leading-8 lg:text-lg">
                  {heroDescription}
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <div className="hotel-shell-card rounded-[1.4rem] px-5 py-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-[rgba(245,238,226,0.58)]">Suites & rooms</p>
                    <p className="mt-2 text-3xl font-bold text-[#fff1dc]">{sections.roomCount}</p>
                  </div>
                  <div className="hotel-shell-card rounded-[1.4rem] px-5 py-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-[rgba(245,238,226,0.58)]">Dining moments</p>
                    <p className="mt-2 text-3xl font-bold text-[#fff1dc]">{sections.diningCount}</p>
                  </div>
                  <div className="hotel-shell-card rounded-[1.4rem] px-5 py-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-[rgba(245,238,226,0.58)]">From nightly</p>
                    <p className="mt-2 text-3xl font-bold text-[#fff1dc]">₦{sections.startingRate.toLocaleString()}</p>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={heroCtaHref}
                    className="hotel-button-primary inline-flex min-h-[3.6rem] items-center justify-center rounded-[1.1rem] px-6 py-3 font-semibold"
                  >
                    {heroCtaLabel}
                  </Link>
                  <Link
                    href={getPublicSitePath(PUBLIC_SITE_KEYS.HOTEL, "/booking")}
                    className="hotel-button-secondary inline-flex min-h-[3.6rem] items-center justify-center rounded-[1.1rem] px-6 py-3 font-semibold"
                  >
                    Book a stay
                  </Link>
                </div>
              </div>

              <div className="hotel-card relative overflow-hidden rounded-[1.75rem] p-4 shadow-[0_24px_48px_rgba(7,13,16,0.16)]">
                <div className="relative h-[24rem] overflow-hidden rounded-[1.4rem] bg-[rgba(17,22,25,0.08)] sm:h-[28rem]">
                  <Image
                    src={heroImage}
                    alt={activeHero?.title || featuredRoom?.name || site.displayName}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 48vw"
                    className="object-cover"
                  />
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgba(18,52,60,0.48)]">Featured stay</p>
                    <p className="mt-1 text-2xl font-bold text-[var(--foreground-strong)]">{featuredRoom?.name || "Signature room"}</p>
                  </div>
                  <Link
                    href={featuredRoom ? getPublicSitePath(PUBLIC_SITE_KEYS.HOTEL, `/rooms/${featuredRoom._id}`) : getPublicSitePath(PUBLIC_SITE_KEYS.HOTEL, "/rooms")}
                    className="hotel-button-ghost inline-flex min-h-[3rem] items-center justify-center rounded-[1rem] px-5 py-3 text-sm font-semibold"
                  >
                    View details
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </Center>
      </div>

      <div className="px-4 pb-14 sm:px-8">
        <Center>
          <section className="hotel-section rounded-[2rem] px-6 py-8 md:px-8 md:py-10">
            <div className="hotel-divider mb-8 flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="hotel-kicker inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] shadow-sm">
                  Stay collection
                </span>
                <h2 className="mt-4 text-3xl font-bold text-[var(--foreground-strong)]">Rooms designed for restful stays</h2>
                <p className="hotel-muted-page mt-2 max-w-2xl">Browse room types, compare comfort details, and send a direct booking request without going through a cart or stock counter.</p>
              </div>
              <Link href={getPublicSitePath(PUBLIC_SITE_KEYS.HOTEL, "/rooms")} className="hotel-button-ghost inline-flex min-h-[3rem] items-center justify-center rounded-[1rem] px-5 py-3 text-sm font-semibold">
                View all rooms
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              {previewRooms.map((room) => (
                <HotelRoomCard key={room._id} room={room} featured />
              ))}
            </div>
          </section>
        </Center>
      </div>

      <div className="px-4 pb-14 sm:px-8">
        <Center>
          <section className="hotel-section rounded-[2rem] px-6 py-8 md:px-8 md:py-10">
            <div className="hotel-divider mb-8 flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="hotel-kicker inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] shadow-sm">
                  Lounge service
                </span>
                <h2 className="mt-4 text-3xl font-bold text-[var(--foreground-strong)]">Lounge and dining, without ecommerce clutter</h2>
                <p className="hotel-muted-page mt-2 max-w-2xl">Showcase plates, drinks, and service windows like a proper hotel lounge menu instead of a stock-managed storefront.</p>
              </div>
              <Link href={getPublicSitePath(PUBLIC_SITE_KEYS.HOTEL, "/lounge")} className="hotel-button-ghost inline-flex min-h-[3rem] items-center justify-center rounded-[1rem] px-5 py-3 text-sm font-semibold">
                Visit the lounge page
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              {previewDining.map((item) => (
                <HotelDiningCard key={item._id} item={item} />
              ))}
            </div>
          </section>
        </Center>
      </div>

      <div className="px-4 pb-16 sm:px-8">
        <Center>
          <section className="hotel-shell rounded-[2rem] px-6 py-8 md:px-8 md:py-10">
            <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr] lg:items-center">
              <div>
                <span className="hotel-shell-kicker inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] shadow-sm">
                  Guest experience
                </span>
                <h2 className="mt-4 text-3xl font-bold text-[#fff1dc]">A calmer hotel-side flow</h2>
                <p className="hotel-shell-muted mt-3 max-w-2xl text-base leading-8">The hotel branch now behaves like a hotel and lounge site: rooms are browsed by stay type, lounge offerings are shown as service highlights, and reservation requests go straight to the hotel desk.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  "Direct booking requests",
                  "Room-first browsing",
                  "Lounge menu presentation",
                  "Arrival coordination support",
                ].map((item) => (
                  <div key={item} className="hotel-shell-card rounded-[1.25rem] px-4 py-4 text-sm font-semibold text-[#fff1dc]">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </Center>
      </div>
    </>
  );
}