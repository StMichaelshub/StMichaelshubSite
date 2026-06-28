import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import Center from "@/components/Center";
import Header from "@/components/Header";
import HotelBookingForm from "@/components/HotelBookingForm";
import HotelRoomCard from "@/components/HotelRoomCard";
import {
  getHotelRoomAmenities,
  getHotelRoomBedLabel,
  getHotelRoomOccupancy,
  getHotelRoomRateLabel,
} from "@/lib/hotelCatalog";
import { getPrimaryProductImage, normalizeProductImages, PRODUCT_IMAGE_PLACEHOLDER } from "@/lib/productImages";
import { PUBLIC_SITE_KEYS, getPublicSiteConfig, getPublicSitePath } from "@/lib/publicSite";
import { resolveHotelCatalogSections, resolveHotelRoomById } from "@/lib/hotelStorefront";
import { isHotelRoomProduct } from "@/lib/hotelCatalog";
import { getStorefrontProducts } from "@/lib/storefrontCatalog";

export default function HotelRoomDetailPage({ site, room, relatedRooms }) {
  const galleryImages = normalizeProductImages(room.images);
  const amenities = getHotelRoomAmenities(room);

  return (
    <>
      <Head>
        <title>{`${room.name} | ${site.displayName}`}</title>
      </Head>
      <Header siteKey={site.key} />
      <Center>
        <div className="hotel-page min-h-screen px-4 py-8 sm:px-8 sm:py-10">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <section className="hotel-shell rounded-[2rem] p-5 sm:p-6 lg:p-8">
              <div className="flex flex-wrap gap-3">
                <span className="hotel-shell-kicker inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] shadow-sm">
                  {room.categoryName || room.category || "Room"}
                </span>
                <span className="hotel-rate-pill rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] shadow-sm">
                  {getHotelRoomRateLabel(room)}
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-bold text-[#fff1dc] sm:text-4xl">{room.name}</h1>
              <p className="hotel-shell-muted mt-4 text-base leading-8">{room.description}</p>

              <div className="mt-6 relative overflow-hidden rounded-[1.6rem] bg-[rgba(255,250,243,0.08)]">
                <Image
                  src={getPrimaryProductImage(room.images) || PRODUCT_IMAGE_PLACEHOLDER}
                  alt={room.name}
                  width={1200}
                  height={760}
                  priority
                  sizes="(max-width: 1024px) 100vw, 52vw"
                  className="h-auto w-full object-cover"
                />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {(galleryImages.length ? galleryImages : [{ full: PRODUCT_IMAGE_PLACEHOLDER, thumb: PRODUCT_IMAGE_PLACEHOLDER }]).slice(0, 3).map((image, index) => (
                  <div key={`${image.thumb}-${index}`} className="relative h-28 overflow-hidden rounded-[1.2rem] bg-[rgba(255,250,243,0.08)] sm:h-36">
                    <Image
                      src={image.thumb}
                      alt={`${room.name} gallery ${index + 1}`}
                      fill
                      sizes="(max-width: 768px) 33vw, 20vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="hotel-shell-card rounded-[1.35rem] px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[rgba(245,238,226,0.56)]">Occupancy</p>
                  <p className="mt-2 text-lg font-bold text-[#fff1dc]">{getHotelRoomOccupancy(room)}</p>
                </div>
                <div className="hotel-shell-card rounded-[1.35rem] px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[rgba(245,238,226,0.56)]">Bed setup</p>
                  <p className="mt-2 text-lg font-bold text-[#fff1dc]">{getHotelRoomBedLabel(room)}</p>
                </div>
              </div>

              <div className="hotel-shell-card mt-6 rounded-[1.5rem] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[rgba(245,238,226,0.56)]">Included comforts</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {amenities.map((amenity) => (
                    <span key={amenity} className="rounded-full bg-[rgba(255,250,243,0.1)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#f6d48a]">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href={getPublicSitePath(PUBLIC_SITE_KEYS.HOTEL, "/rooms")} className="hotel-button-secondary inline-flex min-h-[3rem] items-center justify-center rounded-[1rem] px-5 py-3 text-sm font-semibold">
                  Back to rooms
                </Link>
                <Link href={getPublicSitePath(PUBLIC_SITE_KEYS.HOTEL, "/lounge")} className="hotel-button-primary inline-flex min-h-[3rem] items-center justify-center rounded-[1rem] px-5 py-3 text-sm font-semibold">
                  Explore lounge menu
                </Link>
              </div>
            </section>

            <HotelBookingForm
              rooms={[room]}
              selectedRoomId={String(room._id)}
              title="Request this room"
              intro="Choose your dates and guest details. The hotel desk will confirm availability and follow up directly with you."
              submitLabel="Request this room"
              compact
            />
          </div>

          {relatedRooms.length > 0 ? (
            <section className="hotel-section mt-8 rounded-[2rem] p-6 md:p-8">
              <div className="hotel-divider mb-6 flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <span className="hotel-kicker inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] shadow-sm">
                    Similar stays
                  </span>
                  <h2 className="mt-4 text-3xl font-bold text-[var(--foreground-strong)]">Compare other room types</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                {relatedRooms.map((relatedRoom) => (
                  <HotelRoomCard key={relatedRoom._id} room={relatedRoom} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </Center>
    </>
  );
}

export async function getServerSideProps(context) {
  try {
    const { id } = context.query;
    const siteKey = PUBLIC_SITE_KEYS.HOTEL;
    const products = await getStorefrontProducts({ site: siteKey });
    const room = resolveHotelRoomById(id, products);

    if (!room || !isHotelRoomProduct(room)) {
      return { notFound: true };
    }

    const sections = resolveHotelCatalogSections(products);
    const relatedRooms = sections.rooms.filter((candidate) => String(candidate._id) !== String(room._id)).slice(0, 3);

    return {
      props: {
        site: getPublicSiteConfig(siteKey),
        room: JSON.parse(JSON.stringify(room)),
        relatedRooms: JSON.parse(JSON.stringify(relatedRooms)),
      },
    };
  } catch (error) {
    console.error("Hotel room detail SSR error:", error);
    return { notFound: true };
  }
}