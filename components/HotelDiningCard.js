import Image from "next/image";
import Link from "next/link";
import { getPrimaryProductImage } from "@/lib/productImages";
import { getHotelDiningPriceLabel, getHotelPropertyValue } from "@/lib/hotelCatalog";
import { PUBLIC_SITE_KEYS, getPublicSitePath } from "@/lib/publicSite";

export default function HotelDiningCard({ item }) {
  const serviceWindow = getHotelPropertyValue(item, ["Service window", "Serving", "Dining area", "Style"]);

  return (
    <article className="hotel-card flex h-full flex-col overflow-hidden rounded-[1.5rem] shadow-sm">
      <div className="relative h-52 overflow-hidden bg-white">
        <Image
          src={getPrimaryProductImage(item.images)}
          alt={item.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(12,18,22,0.08),_rgba(12,18,22,0.02)_40%,_rgba(12,18,22,0.48))]" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 p-4">
          <span className="hotel-badge rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] shadow-sm">
            {item.categoryName || item.category || "Lounge"}
          </span>
          <span className="hotel-rate-pill rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] shadow-sm">
            {getHotelDiningPriceLabel(item)}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h2 className="text-xl font-bold text-[var(--foreground-strong)]">{item.name}</h2>
        <p className="hotel-muted-page mt-3 text-sm leading-7">{item.description}</p>

        {serviceWindow ? (
          <div className="hotel-card-soft mt-5 rounded-[1.2rem] px-4 py-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[rgba(18,52,60,0.46)]">Service note</p>
            <p className="mt-1 text-sm font-semibold text-[var(--foreground-strong)]">{serviceWindow}</p>
          </div>
        ) : null}

        <Link
          href={getPublicSitePath(PUBLIC_SITE_KEYS.HOTEL, "/reserve-table")}
          className="hotel-button-secondary mt-6 inline-flex min-h-[3rem] items-center justify-center rounded-[1rem] px-4 py-3 text-sm font-semibold sm:mt-auto"
        >
          Reserve a table
        </Link>
      </div>
    </article>
  );
}