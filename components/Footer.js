import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Center from "./Center";
import SocialLinks from "@/components/SocialLinks";
import { COMPANY_LINKS, POLICY_LINKS, STORE_DETAILS } from "@/lib/storeDetails";
import {
  getPublicSiteLinkLabel,
  getPublicScopedHref,
  getPublicSiteConfig,
  inferPublicSiteFromPath,
  normalizePublicSite,
} from "@/lib/publicSite";

export default function Footer() {
  const router = useRouter();
  const activeSiteKey = normalizePublicSite(inferPublicSiteFromPath(router.pathname));
  const [socialLinks, setSocialLinks] = useState([]);
  const site = getPublicSiteConfig(activeSiteKey);
  const isHotelSite = site.key === "hotel";
  const profileLabel = site.key === "hotel" ? "Hotel profile" : "Store profile";
  const detailsName = site.key === "hotel" ? site.displayName : STORE_DETAILS.businessName;
  const legalName = site.key === "hotel" ? site.displayName : STORE_DETAILS.businessName;
  const companyLinks = COMPANY_LINKS.map((link) => ({
    ...link,
    href: getPublicScopedHref(activeSiteKey, link.href),
    label: getPublicSiteLinkLabel(activeSiteKey, link.href, link.label),
  }));
  const policyLinks = POLICY_LINKS.map((link) => ({
    ...link,
    href: getPublicScopedHref(activeSiteKey, link.href),
    label: getPublicSiteLinkLabel(activeSiteKey, link.href, link.label),
  }));
  const primaryLinks = (site.primaryFooterLinks || []).map((link) => ({
    ...link,
    href: link.href === "/" ? "/" : getPublicScopedHref(activeSiteKey, link.href),
  }));
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    let cancelled = false;

    async function loadSocialLinks() {
      try {
        const response = await fetch(`/api/public/social-links?site=${activeSiteKey}`);
        if (!response.ok) throw new Error("Social links unavailable");
        const data = await response.json();
        if (!cancelled) {
          setSocialLinks(Array.isArray(data.socialLinks) ? data.socialLinks : []);
        }
      } catch {
        if (!cancelled) {
          setSocialLinks([]);
        }
      }
    }

    loadSocialLinks();

    return () => {
      cancelled = true;
    };
  }, [activeSiteKey]);

  return (
    <footer className="site-footer">
      <Center>
        <div className={`${isHotelSite ? "hotel-footer-panel" : "store-footer-panel"} overflow-hidden rounded-[1.75rem] px-4 py-7 sm:rounded-[2rem] sm:px-6 sm:py-8 md:px-8 md:py-9`}>
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.78fr)_minmax(0,0.78fr)_minmax(0,0.9fr)]">
            <div>
              <span className={`${isHotelSite ? "hotel-shell-kicker" : "store-tag"} inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] shadow-sm`}>
                {profileLabel}
              </span>
              <h2 className={`${isHotelSite ? "text-[#fff1dc]" : "text-[var(--foreground-strong)]"} mt-4 max-w-xl text-[2rem] font-bold leading-tight md:text-[2.4rem]`}>
                {site.displayName}
              </h2>
              <p className={`${isHotelSite ? "hotel-shell-muted" : "store-shell-muted"} mt-3 max-w-lg text-sm leading-7 sm:text-base`}>
                {site.key === "hotel"
                  ? "A refined hotel presence with rooms, lounge reservations, and direct guest support gathered into one polished footer."
                  : "Helpful links, store details, and support in one place."}
              </p>

              <div className="mt-4 grid gap-2.5 min-[420px]:grid-cols-2 xl:max-w-md">
                {companyLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`${isHotelSite ? "hotel-footer-link" : "store-footer-link"} w-full justify-center rounded-2xl px-4 py-3 text-sm font-semibold`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <SocialLinks links={socialLinks} variant={isHotelSite ? "hotel" : "store"} />
            </div>

            <div>
              <p className={`${isHotelSite ? "text-[rgba(245,238,226,0.64)]" : "text-[rgba(18,52,60,0.52)]"} text-sm font-semibold uppercase tracking-[0.24em]`}>
                {site.shortLabel} navigation
              </p>
              <div className="mt-4 grid gap-2.5 min-[420px]:grid-cols-2 xl:grid-cols-1">
                {primaryLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`${isHotelSite ? "hotel-footer-link" : "store-footer-link"} w-full justify-between rounded-2xl px-4 py-3 text-sm font-medium`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className={`${isHotelSite ? "text-[rgba(245,238,226,0.64)]" : "text-[rgba(18,52,60,0.52)]"} text-sm font-semibold uppercase tracking-[0.24em]`}>
                Policies
              </p>
              <div className="mt-4 grid gap-2.5 min-[420px]:grid-cols-2 xl:grid-cols-1">
                {policyLinks.map((policy) => (
                  <Link
                    key={policy.href}
                    href={policy.href}
                    className={`${isHotelSite ? "hotel-footer-link" : "store-footer-link"} w-full justify-between rounded-2xl px-4 py-3 text-sm font-medium`}
                  >
                    {policy.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className={`${isHotelSite ? "text-[rgba(245,238,226,0.64)]" : "text-[rgba(18,52,60,0.52)]"} text-sm font-semibold uppercase tracking-[0.24em]`}>
                Contact details
              </p>
              <div className="mt-4 grid gap-3 min-[460px]:grid-cols-2 xl:grid-cols-1">
                <div className={`${isHotelSite ? "hotel-shell-card" : "store-shell-card"} rounded-[1.2rem] px-4 py-4 shadow-sm`}>
                  <p className={`${isHotelSite ? "text-[#fff1dc]" : "text-[var(--foreground-strong)]"} text-sm font-semibold`}>{site.shortLabel} details</p>
                  <div className={`${isHotelSite ? "hotel-shell-muted" : "store-shell-muted"} mt-3 space-y-2 text-sm leading-7`}>
                    <p>{detailsName}</p>
                    <p>{STORE_DETAILS.country}</p>
                  </div>
                </div>
                <div className={`${isHotelSite ? "hotel-shell-card" : "store-shell-card"} rounded-[1.2rem] px-4 py-4 shadow-sm`}>
                  <p className={`${isHotelSite ? "text-[#fff1dc]" : "text-[var(--foreground-strong)]"} text-sm font-semibold`}>{site.contactPanelTitle || "Reach the team"}</p>
                  <div className="mt-3 space-y-2 text-sm leading-7">
                    <Link
                      href={getPublicScopedHref(activeSiteKey, "/contact")}
                      className={`${isHotelSite ? "hotel-footer-link" : "store-footer-link"} mb-3 w-full justify-center rounded-2xl px-4 py-3 text-sm font-semibold`}
                    >
                      {site.key === "hotel" ? "Contact reservations" : "Contact us"}
                    </Link>
                    <a className={`${isHotelSite ? "hotel-footer-accent" : "store-footer-accent"} block break-all`} href={`mailto:${STORE_DETAILS.email}`}>
                      {STORE_DETAILS.email}
                    </a>
                    {STORE_DETAILS.phoneNumbers.map((phoneNumber) => (
                      <a
                        key={phoneNumber}
                        className={`${isHotelSite ? "hotel-footer-accent" : "store-footer-accent"} block`}
                        href={`tel:${phoneNumber}`}
                      >
                        {phoneNumber}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`${isHotelSite ? "hotel-footer-divider text-[rgba(245,238,226,0.68)]" : "theme-divider text-[rgba(18,52,60,0.58)]"} mt-7 flex flex-col gap-3 border-t pt-4 text-sm md:flex-row md:items-center md:justify-between`}>
            <p className="max-w-xl">© {currentYear} {legalName}.</p>
            <div className="flex flex-col gap-1 md:items-end md:text-right">
              <p>Phone: {STORE_DETAILS.phoneNumbers.join(" · ")}</p>
              <a className={`${isHotelSite ? "hotel-footer-accent" : "store-footer-accent"} break-all`} href={`mailto:${STORE_DETAILS.email}`}>
                {STORE_DETAILS.email}
              </a>
            </div>
          </div>
        </div>
      </Center>
    </footer>
  );
}