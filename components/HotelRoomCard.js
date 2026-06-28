import Image from "next/image";
import Link from "next/link";
import { getPrimaryProductImage } from "@/lib/productImages";
import {
  getHotelRoomAmenities,
  getHotelRoomBedLabel,
  getHotelRoomOccupancy,
  getHotelRoomRateLabel,
} from "@/lib/hotelCatalog";
import { PUBLIC_SITE_KEYS, getPublicSitePath } from "@/lib/publicSite";

export default function HotelRoomCard({ room, featured = false }) {
  const roomHref = getPublicSitePath(PUBLIC_SITE_KEYS.HOTEL, `/rooms/${room._id}`);
  const bookingHref = {
    pathname: getPublicSitePath(PUBLIC_SITE_KEYS.HOTEL, "/booking"),
    query: { roomId: room._id },
  };
  const amenities = getHotelRoomAmenities(room).slice(0, 3);

  return (
    <article className={`hotel-card flex h-full flex-col overflow-hidden rounded-[1.5rem] ${featured ? "shadow-[0_28px_54px_rgba(7,13,16,0.14)]" : "shadow-sm"}`}>
      <Link href={roomHref} className="relative block h-56 overflow-hidden bg-white sm:h-64">
        <Image
          src={getPrimaryProductImage(room.images)}
          alt={room.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover transition duration-500 hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(12,18,22,0.08),_rgba(12,18,22,0.02)_40%,_rgba(12,18,22,0.48))]" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 p-4">
          <span className="hotel-badge rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] shadow-sm">
            {room.categoryName || room.category || "Room"}
          </span>
          <span className="hotel-rate-pill rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] shadow-sm">
            {getHotelRoomRateLabel(room)}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-[var(--foreground-strong)]">{room.name}</h2>
            <p className="hotel-muted-page mt-2 text-sm leading-7">{room.description}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="hotel-card-soft rounded-[1.2rem] px-4 py-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[rgba(18,52,60,0.46)]">Occupancy</p>
            <p className="mt-1 text-sm font-semibold text-[var(--foreground-strong)]">{getHotelRoomOccupancy(room)}</p>
          </div>
          <div className="hotel-card-soft rounded-[1.2rem] px-4 py-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[rgba(18,52,60,0.46)]">Bed setup</p>
            <p className="mt-1 text-sm font-semibold text-[var(--foreground-strong)]">{getHotelRoomBedLabel(room)}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {amenities.map((amenity) => (
            <span key={amenity} className="rounded-full bg-[rgba(188,133,34,0.1)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[rgba(107,72,10,0.92)]">
              {amenity}
            </span>
          ))}
        </div>

        <div className="mt-6 grid gap-3 sm:mt-auto sm:grid-cols-2">
          <Link href={roomHref} className="hotel-button-ghost inline-flex min-h-[3rem] items-center justify-center rounded-[1rem] px-4 py-3 text-sm font-semibold">
            View room
          </Link>
          <Link href={bookingHref} className="hotel-button-primary inline-flex min-h-[3rem] items-center justify-center rounded-[1rem] px-4 py-3 text-sm font-semibold">
            Book this room
          </Link>
        </div>
      </div>
    </article>
  );
}