import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import Center from "@/components/Center";
import {
  PUBLIC_SITE_KEYS,
  getPublicSiteConfig,
  getPublicSitePath,
} from "@/lib/publicSite";

const gatewaySites = [PUBLIC_SITE_KEYS.STORE, PUBLIC_SITE_KEYS.HOTEL].map((siteKey) => {
  const site = getPublicSiteConfig(siteKey);
  return {
    ...site,
    href: getPublicSitePath(siteKey),
  };
});

export default function LandingGateway() {
  return (
    <>
      <Head>
        <title>St Michael&apos;s</title>
        <meta
          name="description"
          content="Choose between the store and hotel side of St Michael&apos;s."
        />
      </Head>

      <Center>
        <div className="min-h-screen px-4 py-8 sm:px-8 sm:py-12">
          <div className="theme-shell-light mx-auto max-w-6xl rounded-[2rem] px-5 py-8 shadow-[0_28px_72px_rgba(18,52,60,0.1)] sm:px-8 sm:py-10 lg:px-12 lg:py-14">
            <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <span className="theme-tag inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] shadow-sm">
                  St Michael&apos;s gateway
                </span>
                <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.04] text-[var(--foreground-strong)] sm:text-5xl">
                  Choose the experience you want to enter.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 theme-muted-page sm:text-lg">
                  Choose the store side for shopping or the hotel side for rooms, dining, and reservations.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {gatewaySites.map((site) => (
                    <Link
                      key={site.key}
                      href={site.href}
                      className="theme-card-light group rounded-[1.6rem] border border-[rgba(20,109,126,0.14)] px-5 py-5 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(18,52,60,0.1)]"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgba(18,52,60,0.52)]">
                        {site.label} side
                      </p>
                      <h2 className="mt-3 text-2xl font-bold text-[var(--foreground-strong)]">
                        {site.displayName}
                      </h2>
                      <p className="mt-3 text-sm leading-7 theme-muted-page">
                        {site.heroDescription}
                      </p>
                      <span className="mt-5 inline-flex rounded-full bg-[rgba(20,148,182,0.12)] px-4 py-2 text-sm font-semibold text-[var(--brand-strong)] transition group-hover:bg-[rgba(20,148,182,0.18)]">
                        Enter {site.shortLabel}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="theme-card-light rounded-[1.85rem] border border-[rgba(20,109,126,0.12)] bg-[rgba(255,255,255,0.84)] p-6 shadow-sm sm:p-8">
                <div className="mx-auto flex max-w-sm flex-col items-center text-center">
                  <div className="rounded-[1.75rem] border border-[rgba(20,109,126,0.12)] bg-white px-6 py-5 shadow-sm">
                    <Image
                      src="/images/st-micheals-logo.png"
                      alt="St. Michael's Logo"
                      width={120}
                      height={120}
                      className="h-auto w-auto object-contain"
                      priority
                    />
                  </div>
                  <h2 className="mt-6 text-3xl font-bold text-[var(--foreground-strong)]">
                    One name. Two easy ways to browse.
                  </h2>
                  <p className="mt-4 text-sm leading-7 theme-muted-page sm:text-base">
                    Use the store side for groceries and household items. Use the hotel side for rooms, dining, and reservations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Center>
    </>
  );
}