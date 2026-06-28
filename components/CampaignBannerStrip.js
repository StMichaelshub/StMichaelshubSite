import Image from "next/image";
import Link from "next/link";
import Center from "@/components/Center";
import { getPublicSitePath } from "@/lib/publicSite";

function getBannerImage(hero) {
  return hero?.bgImage?.[0]?.full || hero?.image?.[0]?.full || "";
}

function getBannerHref(hero, site) {
  return hero?.ctaLink || getPublicSitePath(site.key, "/products");
}

export default function CampaignBannerStrip({ heroes = [], site }) {
  const visibleHeroes = (Array.isArray(heroes) ? heroes : []).filter((hero) => hero?.title);

  if (!visibleHeroes.length) {
    return null;
  }

  return (
    <div className="px-4 pb-8 sm:px-8 lg:pb-10">
      <Center>
        <section className="store-shell rounded-[2rem] px-5 py-5 sm:px-6 md:px-7">
          <div className="mb-5 flex flex-col gap-3 border-b border-[rgba(31,44,51,0.08)] pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[rgba(18,52,60,0.48)]">
                Active campaigns
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[var(--foreground-strong)]">
                More offers ready to shop
              </h2>
            </div>
            <Link
              href={getPublicSitePath(site.key, "/products")}
              className="store-button-secondary inline-flex min-h-[3rem] items-center justify-center rounded-[1rem] px-5 py-3 text-sm font-semibold"
            >
              View all products
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {visibleHeroes.map((hero) => {
              const image = getBannerImage(hero);
              return (
                <Link
                  key={hero._id}
                  href={getBannerHref(hero, site)}
                  className="store-shell-card group grid min-h-[13rem] overflow-hidden rounded-[1.55rem] transition hover:-translate-y-1 hover:shadow-[0_24px_46px_rgba(18,29,35,0.1)] sm:grid-cols-[0.88fr_1.12fr] lg:grid-cols-1"
                >
                  <div className="relative min-h-[10rem] bg-[rgba(255,255,255,0.72)]">
                    {image ? (
                      <Image
                        src={image}
                        alt={hero.title}
                        fill
                        sizes="(max-width: 1024px) 92vw, 28vw"
                        className="object-cover transition duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full min-h-[10rem] items-center justify-center bg-[rgba(176,114,42,0.1)] text-sm font-semibold text-[#8d5a1f]">
                        Campaign
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-between gap-4 p-4 sm:p-5">
                    <div>
                      <span className="store-tag inline-flex rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]">
                        {hero.bannerType === "campaign" ? "Campaign" : "Promotion"}
                      </span>
                      <h3 className="mt-3 line-clamp-2 text-xl font-bold leading-tight text-[var(--foreground-strong)]">
                        {hero.title}
                      </h3>
                      {hero.subtitle ? (
                        <p className="mt-2 line-clamp-2 text-sm leading-6 store-shell-muted">
                          {hero.subtitle}
                        </p>
                      ) : null}
                    </div>
                    <span className="text-sm font-semibold text-[#8d5a1f]">
                      {hero.ctaText || "Shop campaign"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </Center>
    </div>
  );
}
