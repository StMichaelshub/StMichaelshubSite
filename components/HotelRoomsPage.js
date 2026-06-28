import Head from "next/head";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import Center from "@/components/Center";
import Header from "@/components/Header";
import HotelRoomCard from "@/components/HotelRoomCard";
import { PUBLIC_SITE_KEYS, getPublicSitePath } from "@/lib/publicSite";

export default function HotelRoomsPage({ site, rooms }) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const filteredRooms = useMemo(
    () =>
      (rooms || []).filter((room) => {
        const haystack = [room.name, room.description, room.categoryName, room.category]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return !normalizedQuery || haystack.includes(normalizedQuery);
      }),
    [normalizedQuery, rooms]
  );

  return (
    <>
      <Head>
        <title>{`Rooms & Suites | ${site.displayName}`}</title>
      </Head>
      <Header siteKey={site.key} />
      <Center>
        <div className="hotel-page min-h-screen px-4 py-8 sm:px-8 sm:py-10">
          <section className="hotel-shell rounded-[2rem] p-6 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <span className="hotel-shell-kicker inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] shadow-sm">
                  {site.listingEyebrow}
                </span>
                <h1 className="mt-4 text-3xl font-bold text-[#fff1dc] sm:text-4xl">Rooms & Suites</h1>
                <p className="hotel-shell-muted mt-2 max-w-2xl">{site.listingDescription}</p>
              </div>
              <Link href={getPublicSitePath(PUBLIC_SITE_KEYS.HOTEL, "/booking")} className="hotel-button-primary inline-flex min-h-[3rem] items-center justify-center rounded-[1rem] px-5 py-3 text-sm font-semibold">
                Book a stay
              </Link>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="hotel-shell-card rounded-[1.4rem] px-5 py-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[rgba(245,238,226,0.56)]">Guest standard</p>
                <p className="mt-2 text-lg font-semibold text-[#fff1dc]">Quiet stays, direct reservations, and comfort details before you enquire.</p>
              </div>
              <div className="hotel-shell-card rounded-[1.4rem] px-5 py-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[rgba(245,238,226,0.56)]">Published options</p>
                <p className="mt-2 text-3xl font-bold text-[#fff1dc]">{filteredRooms.length}</p>
              </div>
            </div>
          </section>

          <section className="hotel-section mt-6 rounded-[2rem] p-6 md:p-8">
            <div className="mt-0 grid gap-4 md:grid-cols-[1.4fr_0.6fr]">
              <div className="hotel-card rounded-[1.5rem] p-4 shadow-sm">
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search room types, stay styles, or amenities"
                  className="hotel-input-light w-full rounded-2xl px-4 py-3 outline-none"
                />
              </div>
              <div className="hotel-card rounded-[1.5rem] px-5 py-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-[rgba(18,52,60,0.52)]">Available room types</p>
                <p className="mt-2 text-3xl font-bold text-[var(--foreground-strong)]">{filteredRooms.length}</p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-3">
              {filteredRooms.length > 0 ? (
                filteredRooms.map((room) => <HotelRoomCard key={room._id} room={room} />)
              ) : (
                <div className="col-span-full rounded-[1.5rem] border border-dashed border-[rgba(188,133,34,0.22)] px-6 py-12 text-center">
                  <p className="hotel-muted-page">No room types match the current search.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </Center>
    </>
  );
}