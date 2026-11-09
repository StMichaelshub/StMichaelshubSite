import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Center from "./Center";
import SocialLinks from "@/components/SocialLinks";
import { COMPANY_LINKS, POLICY_LINKS, STORE_DETAILS } from "@/lib/storeDetails";
import {
  PUBLIC_SITE_KEYS,
  getPublicScopedHref,
  getPublicSiteConfig,
  getPublicSiteLinkLabel,
  getPublicSitePath,
  inferPublicSiteFromPath,
  normalizePublicSite,
} from "@/lib/publicSite";

/** Simple footer: who we are, where to go, help pages and how to reach us. */
export default function Footer() {
  const router = useRouter();
  const activeSiteKey = normalizePublicSite(inferPublicSiteFromPath(router.pathname));
  const site = getPublicSiteConfig(activeSiteKey);
  const isHotelSite = site.key === PUBLIC_SITE_KEYS.HOTEL;
  const [socialLinks, setSocialLinks] = useState([]);

  const scoped = (links) =>
    links.map((link) => ({
      ...link,
      href: getPublicScopedHref(activeSiteKey, link.href),
      label: getPublicSiteLinkLabel(activeSiteKey, link.href, link.label),
    }));

  const browseLinks = [
    { href: getPublicSitePath(activeSiteKey), label: "Home" },
    ...scoped((site.navLinks || []).filter((link) => link.href !== "/")),
  ];
  const helpLinks = [...scoped(COMPANY_LINKS), ...scoped(POLICY_LINKS)];
  const otherSiteKey = isHotelSite ? PUBLIC_SITE_KEYS.STORE : PUBLIC_SITE_KEYS.HOTEL;
  const otherSite = getPublicSiteConfig(otherSiteKey);
  const legalName = isHotelSite ? site.displayName : STORE_DETAILS.businessName;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/public/social-links?site=${activeSiteKey}`)
      .then((response) => (response.ok ? response.json() : { socialLinks: [] }))
      .then((data) => {
        if (!cancelled) setSocialLinks(Array.isArray(data.socialLinks) ? data.socialLinks : []);
      })
      .catch(() => {
        if (!cancelled) setSocialLinks([]);
      });
    return () => {
      cancelled = true;
    };
  }, [activeSiteKey]);

  const headingClass = `text-xs font-bold uppercase tracking-[0.22em] ${
    isHotelSite ? "text-[rgba(245,238,226,0.6)]" : "text-[rgba(18,52,60,0.52)]"
  }`;
  const linkClass = `text-sm font-medium transition ${
    isHotelSite ? "text-[#f5eee2] hover:text-[#f8d78f]" : "text-[var(--foreground-strong)] hover:text-[#8d5a1f]"
  }`;
  const mutedClass = isHotelSite ? "hotel-shell-muted" : "store-shell-muted";
  const accentClass = isHotelSite ? "hotel-footer-accent" : "store-footer-accent";

  return (
    <footer className="site-footer">
      <Center>
        <div className={`${isHotelSite ? "hotel-footer-panel" : "store-footer-panel"} rounded-[1.75rem] px-5 py-8 sm:px-8`}>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.1fr]">
            <div>
              <p className={`text-xl font-bold ${isHotelSite ? "text-[#fff1dc]" : "text-[var(--foreground-strong)]"}`}>
                {site.displayName}
              </p>
              <p className={`mt-2 max-w-xs text-sm leading-6 ${mutedClass}`}>{site.tagLine}.</p>
              <Link
                href={getPublicSitePath(otherSiteKey)}
                className={`${isHotelSite ? "hotel-footer-link" : "store-footer-link"} mt-4 rounded-full px-4 py-2 text-sm font-semibold`}
              >
                Visit the {otherSite.shortLabel.toLowerCase()} →
              </Link>
              <SocialLinks links={socialLinks} variant={isHotelSite ? "hotel" : "store"} />
            </div>

            <div>
              <p className={headingClass}>{isHotelSite ? "Hotel" : "Shop"}</p>
              <ul className="mt-3 grid gap-2">
                {browseLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={linkClass}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className={headingClass}>Help</p>
              <ul className="mt-3 grid gap-2">
                {helpLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={linkClass}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className={headingClass}>Contact</p>
              <ul className="mt-3 grid gap-2 text-sm">
                {STORE_DETAILS.phoneNumbers.map((phoneNumber) => (
                  <li key={phoneNumber}>
                    <a href={`tel:${phoneNumber}`} className={`${accentClass} font-semibold`}>{phoneNumber}</a>
                  </li>
                ))}
                <li>
                  <a href={`mailto:${STORE_DETAILS.email}`} className={`${accentClass} break-all font-semibold`}>
                    {STORE_DETAILS.email}
                  </a>
                </li>
                <li className={mutedClass}>{STORE_DETAILS.country}</li>
              </ul>
            </div>
          </div>

          <div
            className={`mt-8 border-t pt-4 text-xs ${
              isHotelSite ? "hotel-footer-divider text-[rgba(245,238,226,0.6)]" : "theme-divider text-[rgba(18,52,60,0.56)]"
            }`}
          >
            © {new Date().getFullYear()} {legalName}. All rights reserved.
          </div>
        </div>
      </Center>
    </footer>
  );
}
