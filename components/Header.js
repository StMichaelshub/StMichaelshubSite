import Link from "next/link";
import Image from "next/image";
import Center from "./Center";
import { useContext, useEffect, useState } from "react";
import { CartContext } from "./CartContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCartShopping,
  faBars,
  faTimes,
  faArrowRight,
  faEnvelope,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/router";
import { COMPANY_LINKS, STORE_DETAILS } from "@/lib/storeDetails";
import {
  PUBLIC_SITE_KEYS,
  getPublicScopedHref,
  getPublicSiteConfig,
  inferPublicSiteFromPath,
  normalizePublicSite,
} from "@/lib/publicSite";

export default function Header({ siteKey }) {
  const { cartCount } = useContext(CartContext);
  const [navOpen, setNavOpen] = useState(false);
  const router = useRouter();
  const activeSiteKey = normalizePublicSite(siteKey || inferPublicSiteFromPath(router.pathname));
  const site = getPublicSiteConfig(activeSiteKey);
  const isHotelSite = activeSiteKey === PUBLIC_SITE_KEYS.HOTEL;
  const isStoreSite = !isHotelSite;
  const navLinks = (site.navLinks || []).map((link) => ({
    ...link,
    href: getPublicScopedHref(activeSiteKey, link.href),
  }));
  const companyLinks = COMPANY_LINKS.map((link) => ({
    ...link,
    href: getPublicScopedHref(activeSiteKey, link.href),
  }));
  const cartHref = getPublicScopedHref(activeSiteKey, "/cart");
  const showCart = site.showCart !== false;
  const cartIsActive = router.asPath === cartHref || router.asPath.startsWith(`${cartHref}?`);

  useEffect(() => {
    const closeMobileNav = () => {
      setNavOpen(false);
    };

    router.events.on("routeChangeStart", closeMobileNav);

    return () => {
      router.events.off("routeChangeStart", closeMobileNav);
    };
  }, [router.events]);

  useEffect(() => {
    if (!navOpen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setNavOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [navOpen]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");

    const handleChange = (event) => {
      if (event.matches) {
        setNavOpen(false);
      }
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  const isActiveRoute = (href) => {
    const currentPath = router.asPath.split("?")[0];

    if (href === getPublicScopedHref(activeSiteKey, "/")) {
      return currentPath === href;
    }

    return currentPath.startsWith(href);
  };

  const mobileSupportLinks = [
    {
      href: `mailto:${STORE_DETAILS.email}`,
      label: `Email the ${site.shortLabel.toLowerCase()} desk`,
      value: STORE_DETAILS.email,
      icon: faEnvelope,
    },
    {
      href: `tel:${STORE_DETAILS.phoneNumbers[0]}`,
      label: `Call the ${site.shortLabel.toLowerCase()} desk`,
      value: STORE_DETAILS.phoneNumbers[0],
      icon: faPhone,
    },
  ];

  return (
    <header className={isHotelSite ? "hotel-header sticky top-0 z-[100] w-full" : "store-header sticky top-0 z-[100] w-full"}>
      <div className={isHotelSite ? "hotel-header-topbar text-[0.72rem] uppercase tracking-[0.24em]" : "store-header-topbar text-[0.72rem] uppercase tracking-[0.24em]"}>
        <Center>
          <div className="flex flex-col items-start justify-between gap-2 px-4 py-2 sm:flex-row sm:items-center sm:gap-3 sm:px-6">
            <span className="text-[0.62rem] tracking-[0.18em] sm:text-[0.72rem] sm:tracking-[0.24em]">
              <span className="sm:hidden">{site.topBarCopy}</span>
              <span className="hidden sm:inline">{site.topBarCopy}</span>
            </span>
            <Link href={getPublicScopedHref(activeSiteKey, site.topBarCtaHref || "/products")} className={isHotelSite ? "inline-flex items-center gap-2 font-semibold text-[#f8d78f] transition hover:text-white" : "inline-flex items-center gap-2 font-semibold text-[rgba(250,244,232,0.92)] transition hover:text-[#ffd39d]"}>
              <span className="sm:hidden">{site.topBarCta}</span>
              <span className="hidden sm:inline">{site.topBarCta}</span>
              <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
            </Link>
          </div>
        </Center>
      </div>

      <Center>
        <div className="relative px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            <Link href={getPublicScopedHref(activeSiteKey, "/")} className="flex min-w-0 flex-1 items-center gap-3">
              <div className={isHotelSite ? "hotel-header-logo rounded-2xl p-2" : "store-header-logo rounded-2xl p-2"}>
                <Image
                  src="/images/st-micheals-logo.png"
                  alt="St. Michael's Logo"
                  width={40}
                  height={40}
                  className="size-9 object-contain sm:size-10"
                />
              </div>
              <div className="min-w-0">
                <span className={isHotelSite ? "block truncate text-[0.98rem] font-bold text-[#fff1dc] sm:text-xl" : "block truncate text-[0.98rem] font-bold text-[#213238] sm:text-xl"}>
                  {site.displayName}
                </span>
                <span className={isHotelSite ? "block truncate text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[rgba(245,238,226,0.68)] sm:text-xs sm:tracking-[0.26em]" : "block truncate text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[rgba(33,50,56,0.58)] sm:text-xs sm:tracking-[0.26em]"}>
                  {site.tagLine}
                </span>
              </div>
            </Link>

            <div className="flex shrink-0 items-center gap-2 md:hidden">
              {showCart ? (
                <Link
                  href={cartHref}
                  data-cart-icon
                  className={`inline-flex h-11 min-w-[3rem] items-center justify-center rounded-full px-3 py-2 text-sm font-semibold shadow-sm transition ${
                    cartIsActive
                      ? isHotelSite ? "hotel-button-primary" : "store-button-accent"
                      : isHotelSite ? "hotel-button-secondary" : "store-button-primary"
                  }`}
                  aria-label="View cart"
                >
                  <span className="relative inline-flex items-center justify-center">
                    <FontAwesomeIcon icon={faCartShopping} className="text-sm" />
                    <span className="absolute -right-3 -top-3 rounded-full bg-[var(--foreground-strong)] px-1.5 py-[1px] text-[0.62rem] font-semibold text-white shadow-sm">
                      {cartCount || 0}
                    </span>
                  </span>
                </Link>
              ) : null}

              <button
                type="button"
                className={`inline-flex min-h-[2.85rem] items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold shadow-sm transition ${
                  navOpen
                    ? isHotelSite
                      ? "border-[rgba(216,172,79,0.24)] bg-[rgba(255,250,243,0.12)] text-[#f8edd8]"
                      : "border-[rgba(176,114,42,0.2)] bg-[rgba(247,241,232,0.96)] text-[#213238]"
                    : isHotelSite
                      ? "border-[rgba(216,172,79,0.14)] bg-[rgba(255,250,243,0.06)] text-[#f8edd8]"
                      : "border-[rgba(31,44,51,0.12)] bg-white/82 text-[#213238]"
                }`}
                onClick={() => setNavOpen((currentValue) => !currentValue)}
                aria-controls="mobile-site-nav"
                aria-expanded={navOpen}
                aria-label={navOpen ? "Close navigation menu" : "Open navigation menu"}
              >
                <FontAwesomeIcon icon={navOpen ? faTimes : faBars} className="text-sm" />
                <span>{navOpen ? "Close" : "Menu"}</span>
              </button>
            </div>

            <nav className={isHotelSite ? "hidden items-center gap-3 font-medium text-[#f5eee2] md:flex" : "hidden items-center gap-3 font-medium text-[#213238] md:flex"}>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-4 py-2 transition ${
                    isActiveRoute(link.href)
                      ? isHotelSite ? "hotel-button-primary shadow-lg" : "store-button-accent shadow-lg"
                      : isHotelSite ? "hover:bg-[rgba(255,250,243,0.08)] hover:text-[#f8d78f]" : "hover:bg-[rgba(31,44,51,0.06)] hover:text-[#8d5a1f]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {showCart ? (
                <Link
                  href={cartHref}
                  data-cart-icon
                  className={isHotelSite ? "hotel-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2 transition shadow-lg" : "store-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2 transition shadow-lg"}
                >
                  <FontAwesomeIcon icon={faCartShopping} />
                  <span>Cart</span>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold text-white">
                    {cartCount || 0}
                  </span>
                </Link>
              ) : null}
            </nav>
          </div>

          {navOpen && (
            <div className="absolute inset-x-0 top-full z-[90] pt-3 md:hidden">
              <nav
                id="mobile-site-nav"
                className={isHotelSite ? "overflow-hidden rounded-[1.75rem] border border-[rgba(216,172,79,0.14)] bg-[rgba(13,18,22,0.96)] shadow-[0_24px_52px_rgba(7,13,16,0.26)] backdrop-blur-xl" : "overflow-hidden rounded-[1.75rem] border border-[rgba(31,44,51,0.1)] bg-[rgba(255,252,247,0.99)] shadow-[0_24px_52px_rgba(18,29,35,0.1)] backdrop-blur-xl"}
              >
                <div className="grid gap-4 p-4">
                  <div className={isHotelSite ? "hotel-shell-card rounded-[1.4rem] p-4" : "store-shell-card rounded-[1.4rem] p-4 shadow-sm"}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={isHotelSite ? "text-xs font-semibold uppercase tracking-[0.24em] text-[rgba(245,238,226,0.62)]" : "text-xs font-semibold uppercase tracking-[0.24em] text-[rgba(18,52,60,0.52)]"}>
                          Browse the {site.shortLabel.toLowerCase()}
                        </p>
                        <p className={isHotelSite ? "mt-2 text-sm leading-7 hotel-shell-muted" : "mt-2 text-sm leading-7 store-shell-muted"}>
                          Jump to the main {site.shortLabel.toLowerCase()} pages with larger touch targets and clearer grouping.
                        </p>
                      </div>
                      <span className={isHotelSite ? "rounded-full bg-[rgba(216,172,79,0.14)] px-3 py-1 text-xs font-semibold text-[#f8d78f]" : "rounded-full bg-[rgba(176,114,42,0.1)] px-3 py-1 text-xs font-semibold text-[#8d5a1f]"}>
                        {showCart ? `${cartCount || 0} in cart` : site.tagLine}
                      </span>
                    </div>

                    {showCart ? (
                      <Link
                        href={cartHref}
                        onClick={() => setNavOpen(false)}
                        className={`mt-4 flex items-center justify-between rounded-[1.2rem] px-4 py-3 text-sm font-semibold transition ${
                          cartIsActive
                            ? isHotelSite ? "hotel-button-primary" : "store-button-accent"
                            : isHotelSite ? "hotel-button-secondary" : "store-button-primary"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faCartShopping} />
                          Review cart
                        </span>
                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold text-white">
                          {cartCount || 0}
                        </span>
                      </Link>
                    ) : (
                      <Link
                        href={getPublicScopedHref(activeSiteKey, site.topBarCtaHref || "/")}
                        onClick={() => setNavOpen(false)}
                        className={isHotelSite ? "hotel-button-primary mt-4 flex items-center justify-between rounded-[1.2rem] px-4 py-3 text-sm font-semibold transition" : "store-button-accent mt-4 flex items-center justify-between rounded-[1.2rem] px-4 py-3 text-sm font-semibold transition"}
                      >
                        <span>{site.topBarCta}</span>
                        <FontAwesomeIcon icon={faArrowRight} />
                      </Link>
                    )}

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      {navLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setNavOpen(false)}
                          className={`rounded-[1.15rem] px-4 py-3 text-sm font-semibold transition ${
                            isActiveRoute(link.href)
                              ? isHotelSite ? "hotel-button-primary" : "store-button-accent"
                              : isHotelSite ? "bg-[rgba(255,250,243,0.06)] text-[#f5eee2] hover:bg-[rgba(216,172,79,0.12)]" : "bg-[rgba(31,44,51,0.05)] text-[#213238] hover:bg-[rgba(31,44,51,0.09)]"
                          }`}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 min-[460px]:grid-cols-[0.95fr_1.05fr]">
                    <div className={isHotelSite ? "hotel-shell-card rounded-[1.4rem] p-4" : "store-shell-card rounded-[1.4rem] p-4 shadow-sm"}>
                      <p className={isHotelSite ? "text-xs font-semibold uppercase tracking-[0.24em] text-[rgba(245,238,226,0.62)]" : "text-xs font-semibold uppercase tracking-[0.24em] text-[rgba(18,52,60,0.52)]"}>
                        Company pages
                      </p>
                      <div className="mt-3 grid gap-3">
                        {companyLinks.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setNavOpen(false)}
                            className={`rounded-[1.15rem] px-4 py-3 text-sm font-semibold transition ${
                              isActiveRoute(link.href)
                                ? isHotelSite ? "hotel-button-primary" : "store-button-accent"
                                : isHotelSite ? "hotel-footer-link" : "store-footer-link"
                            }`}
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div className={isHotelSite ? "hotel-shell-card rounded-[1.4rem] p-4" : "store-shell-card rounded-[1.4rem] p-4 shadow-sm"}>
                      <p className={isHotelSite ? "text-xs font-semibold uppercase tracking-[0.24em] text-[rgba(245,238,226,0.62)]" : "text-xs font-semibold uppercase tracking-[0.24em] text-[rgba(18,52,60,0.52)]"}>
                        Need help fast?
                      </p>
                      <div className="mt-3 space-y-3">
                        {mobileSupportLinks.map((link) => (
                          <a
                            key={link.href}
                            href={link.href}
                            className={isHotelSite ? "hotel-footer-link flex items-start gap-3 rounded-[1.15rem] px-4 py-3" : "store-footer-link flex items-start gap-3 rounded-[1.15rem] px-4 py-3"}
                          >
                            <span className={isHotelSite ? "inline-flex size-9 items-center justify-center rounded-full bg-[rgba(216,172,79,0.14)] text-[#f8d78f]" : "inline-flex size-9 items-center justify-center rounded-full bg-[rgba(176,114,42,0.1)] text-[#8d5a1f]"}>
                              <FontAwesomeIcon icon={link.icon} />
                            </span>
                            <span className="min-w-0">
                              <span className={isHotelSite ? "block text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(245,238,226,0.56)]" : "block text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(18,52,60,0.5)]"}>
                                {link.label}
                              </span>
                              <span className="mt-1 block break-all text-sm font-semibold">
                                {link.value}
                              </span>
                            </span>
                          </a>
                        ))}

                        <div className={isHotelSite ? "rounded-[1.15rem] border border-[rgba(216,172,79,0.12)] bg-[rgba(255,250,243,0.06)] px-4 py-3 text-sm leading-7 text-[rgba(245,238,226,0.72)]" : "rounded-[1.15rem] border border-[rgba(31,44,51,0.08)] bg-[rgba(247,243,236,0.92)] px-4 py-3 text-sm leading-7 text-[rgba(18,52,60,0.74)]"}>
                          <p className={isHotelSite ? "font-semibold text-[#fff1dc]" : "font-semibold text-[var(--foreground-strong)]"}>Nigeria service coverage</p>
                          <p className="mt-1">Location Code: {STORE_DETAILS.locationCode}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </nav>
            </div>
          )}
        </div>
      </Center>
    </header>
  );
}
