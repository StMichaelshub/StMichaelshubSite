import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Header from "@/components/Header";
import Center from "@/components/Center";
import { RESOURCE_LINKS, STORE_DETAILS } from "@/lib/storeDetails";
import {
  getPublicSiteLinkLabel,
  getPublicScopedHref,
  getPublicSiteConfig,
  inferPublicSiteFromPath,
  normalizePublicSite,
} from "@/lib/publicSite";

export default function PolicyPageLayout({
  title,
  intro,
  sections,
  eyebrow,
  backHref = "/",
  backLabel,
  supportHref = "/contact",
  supportLabel,
  relatedTitle,
  relatedLinks = RESOURCE_LINKS,
}) {
  const router = useRouter();
  const activeSiteKey = normalizePublicSite(inferPublicSiteFromPath(router.pathname));
  const site = getPublicSiteConfig(activeSiteKey);
  const isHotelSite = site.key === "hotel";
  const businessLabel = isHotelSite ? site.displayName : STORE_DETAILS.businessName;
  const contactLabel = isHotelSite ? "Email reservations" : "Email the store";
  const resolvedEyebrow = eyebrow || (isHotelSite ? "Hotel policy" : "Store policy");
  const resolvedBackLabel = backLabel || (isHotelSite ? "Back to hotel home" : "Back to home");
  const resolvedSupportLabel = supportLabel || (isHotelSite ? "Contact reservations" : "Contact store");
  const resolvedRelatedTitle = relatedTitle || (isHotelSite ? "Hotel pages" : "Useful pages");
  const resolvedRelatedLinks = relatedLinks.map((link) => ({
    ...link,
    href: getPublicScopedHref(activeSiteKey, link.href),
    label: getPublicSiteLinkLabel(activeSiteKey, link.href, link.label),
  }));
  return (
    <>
      <Head>
        <title>{`${title} | ${site.displayName}`}</title>
      </Head>
      <Header siteKey={activeSiteKey} />
      <Center>
        <div className={`${isHotelSite ? "hotel-page" : ""} min-h-screen px-4 py-6 sm:px-6 sm:py-8`}>
          <div className={`${isHotelSite ? "hotel-shell" : "theme-shell-light"} mx-auto max-w-4xl rounded-[1.75rem] p-4 sm:rounded-[2rem] sm:p-6 lg:p-8`}>
            <div className={`${isHotelSite ? "hotel-divider" : "border-[rgba(20,109,126,0.12)]"} hotel-motion-fade flex flex-col gap-5 border-b pb-6 sm:gap-6`}>
              <div>
                <span className={`${isHotelSite ? "hotel-shell-kicker" : "theme-tag"} inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] shadow-sm`}>
                  {resolvedEyebrow}
                </span>
                <h1 className={`${isHotelSite ? "text-[#fff3df]" : "text-[var(--foreground-strong)]"} mt-4 text-3xl font-extrabold sm:text-4xl`}>
                  {title}
                </h1>
                <p className={`${isHotelSite ? "hotel-shell-muted" : "theme-muted-page"} mt-3 max-w-2xl text-sm leading-7 sm:text-base sm:leading-8`}>
                  {intro}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {supportHref ? (
                  <Link
                    href={getPublicScopedHref(activeSiteKey, supportHref)}
                    className={`${isHotelSite ? "hotel-button-primary" : "theme-footer-link text-[var(--foreground-strong)]"} inline-flex w-full items-center justify-center rounded-full px-4 py-3 text-sm font-semibold sm:w-auto`}
                  >
                    {resolvedSupportLabel}
                  </Link>
                ) : null}
                <Link
                  href={getPublicScopedHref(activeSiteKey, backHref)}
                  className={`${isHotelSite ? "hotel-button-secondary" : "theme-card-light text-[var(--foreground-strong)]"} inline-flex w-full items-center justify-center rounded-full px-4 py-3 text-sm font-semibold shadow-sm sm:w-auto`}
                >
                  {resolvedBackLabel}
                </Link>
              </div>

              {resolvedRelatedLinks.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {resolvedRelatedLinks.slice(0, 4).map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`${isHotelSite ? "hotel-footer-link" : "theme-footer-link text-[var(--foreground-strong)]"} rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em]`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="mt-8 space-y-4">
              {sections.map((section, index) => (
                <section
                  key={section.heading}
                  className={`${isHotelSite ? "hotel-card hotel-interactive" : "theme-card-light"} hotel-motion-fade rounded-[1.35rem] p-4 shadow-sm sm:rounded-[1.5rem] sm:p-6`}
                  style={isHotelSite ? { animationDelay: `${80 + index * 70}ms` } : undefined}
                >
                  <h2 className="text-lg font-bold text-[var(--foreground-strong)] sm:text-xl">{section.heading}</h2>
                  <div className="mt-3 space-y-3">
                    {section.body.map((paragraph) => (
                      <p key={paragraph} className={`${isHotelSite ? "hotel-muted-page" : "theme-muted-page"} text-sm leading-7 sm:text-base sm:leading-8`}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_0.95fr]">
              <div className={`${isHotelSite ? "hotel-card hotel-motion-fade" : "theme-card-light"} rounded-[1.35rem] p-4 shadow-sm sm:rounded-[1.5rem] sm:p-6`} style={isHotelSite ? { animationDelay: "260ms" } : undefined}>
                <p className={`${isHotelSite ? "text-[rgba(18,52,60,0.48)]" : "text-[rgba(18,52,60,0.52)]"} text-xs font-semibold uppercase tracking-[0.24em]`}>
                  Business details
                </p>
                <div className="mt-4 space-y-3 text-sm leading-7 text-[rgba(18,52,60,0.78)]">
                  <p><span className="font-semibold text-[var(--foreground-strong)]">Business:</span> {businessLabel}</p>
                  <p><span className="font-semibold text-[var(--foreground-strong)]">Side:</span> {site.displayName}</p>
                  <p><span className="font-semibold text-[var(--foreground-strong)]">Phone:</span> {STORE_DETAILS.phoneNumbers.join(", ")}</p>
                  <p><span className="font-semibold text-[var(--foreground-strong)]">Email:</span> {STORE_DETAILS.email}</p>
                  <p><span className="font-semibold text-[var(--foreground-strong)]">Country:</span> {STORE_DETAILS.country}</p>
                  <p><span className="font-semibold text-[var(--foreground-strong)]">Location Code:</span> {STORE_DETAILS.locationCode}</p>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <a
                    href={`mailto:${STORE_DETAILS.email}`}
                    className={`${isHotelSite ? "hotel-button-secondary" : "theme-footer-link text-[var(--foreground-strong)]"} break-all rounded-2xl px-4 py-3 text-sm font-medium text-center`}
                  >
                    {contactLabel}
                  </a>
                  {STORE_DETAILS.phoneNumbers.map((phoneNumber) => (
                    <a
                      key={phoneNumber}
                      href={`tel:${phoneNumber}`}
                      className={`${isHotelSite ? "hotel-button-ghost" : "theme-footer-link text-[var(--foreground-strong)]"} rounded-2xl px-4 py-3 text-sm font-medium text-center`}
                    >
                      Call {phoneNumber}
                    </a>
                  ))}
                </div>
              </div>

              <div className={`${isHotelSite ? "hotel-card hotel-motion-fade" : "theme-card-light"} rounded-[1.35rem] p-4 shadow-sm sm:rounded-[1.5rem] sm:p-6`} style={isHotelSite ? { animationDelay: "320ms" } : undefined}>
                <p className={`${isHotelSite ? "text-[rgba(18,52,60,0.48)]" : "text-[rgba(18,52,60,0.52)]"} text-xs font-semibold uppercase tracking-[0.24em]`}>
                  {resolvedRelatedTitle}
                </p>
                <div className="mt-4 grid gap-3 min-[420px]:grid-cols-2 lg:grid-cols-1">
                  {resolvedRelatedLinks.map((policy) => (
                    <Link
                      key={policy.href}
                      href={policy.href}
                      className={`${isHotelSite ? "hotel-button-ghost" : "theme-footer-link text-[var(--foreground-strong)]"} w-full justify-between rounded-2xl px-4 py-3 text-sm font-medium`}
                    >
                      {policy.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Center>
    </>
  );
}