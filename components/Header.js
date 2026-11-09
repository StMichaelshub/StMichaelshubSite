import Link from "next/link";
import Image from "next/image";
import Center from "./Center";
import MobileTabBar from "./MobileTabBar";
import { useContext, useEffect, useState } from "react";
import { CartContext } from "./CartContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCartShopping,
  faBars,
  faTimes,
  faMagnifyingGlass,
  faPhone,
  faEnvelope,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/router";
import { COMPANY_LINKS, STORE_DETAILS } from "@/lib/storeDetails";
import {
  PUBLIC_SITE_KEYS,
  getPublicScopedHref,
  getPublicSiteConfig,
  getPublicSitePath,
  inferPublicSiteFromPath,
  normalizePublicSite,
} from "@/lib/publicSite";

/**
 * One header for both sides of the site.
 * - A slim switcher so people can always jump between the Store and the Hotel.
 * - A short main menu (the same links on desktop, in the mobile menu and in the
 *   phone tab bar), a store search box and the cart.
 */
export default function Header({ siteKey }) {
  const { cartCount } = useContext(CartContext);
  const [navOpen, setNavOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const router = useRouter();
  const activeSiteKey = normalizePublicSite(siteKey || inferPublicSiteFromPath(router.pathname));
  const site = getPublicSiteConfig(activeSiteKey);
  const isHotelSite = activeSiteKey === PUBLIC_SITE_KEYS.HOTEL;
  const showCart = site.showCart !== false;

  const navLinks = (site.navLinks || [])
    .filter((link) => link.href !== "/")
    .map((link) => ({ ...link, href: getPublicScopedHref(activeSiteKey, link.href) }));
  const companyLinks = COMPANY_LINKS.map((link) => ({
    ...link,
    href: getPublicScopedHref(activeSiteKey, link.href),
  }));
  const homeHref = getPublicSitePath(activeSiteKey);
  const cartHref = getPublicScopedHref(activeSiteKey, "/cart");
  const primaryCta = isHotelSite
    ? { href: getPublicScopedHref(activeSiteKey, "/booking"), label: "Book a stay" }
    : null;

  useEffect(() => {
    const closeMenu = () => setNavOpen(false);
    router.events.on("routeChangeStart", closeMenu);
    return () => router.events.off("routeChangeStart", closeMenu);
  }, [router.events]);

  useEffect(() => {
    if (!navOpen) return undefined;

    const originalOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setNavOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [navOpen]);

  const currentPath = router.asPath.split("?")[0];
  const isActiveRoute = (href) =>
    href === homeHref ? currentPath === href : currentPath === href || currentPath.startsWith(`${href}/`);

  const submitSearch = (event) => {
    event.preventDefault();
    const query = searchText.trim();
    router.push({
      pathname: getPublicSitePath(activeSiteKey, "/products"),
      query: query ? { q: query } : {},
    });
  };

  const theme = isHotelSite
    ? {
        header: "hotel-header",
        strip: "hotel-header-topbar",
        logo: "hotel-header-logo",
        name: "text-[#fff1dc]",
        tagline: "text-[rgba(245,238,226,0.68)]",
        link: "text-[#f5eee2] hover:bg-[rgba(255,250,243,0.08)] hover:text-[#f8d78f]",
        active: "hotel-button-primary",
        primary: "hotel-button-primary",
        secondary: "hotel-button-secondary",
        panel: "border-[rgba(216,172,79,0.14)] bg-[rgba(13,18,22,0.98)] text-[#f5eee2]",
        muted: "text-[rgba(245,238,226,0.62)]",
        rowLink: "hover:bg-[rgba(216,172,79,0.12)]",
        switchOn: "bg-[#d8ac4f] text-[#1a1408]",
        switchOff: "text-[rgba(245,238,226,0.78)] hover:text-white",
      }
    : {
        header: "store-header",
        strip: "store-header-topbar",
        logo: "store-header-logo",
        name: "text-[#213238]",
        tagline: "text-[rgba(33,50,56,0.58)]",
        link: "text-[#213238] hover:bg-[rgba(31,44,51,0.06)] hover:text-[#8d5a1f]",
        active: "store-button-accent",
        primary: "store-button-primary",
        secondary: "store-button-secondary",
        panel: "border-[rgba(31,44,51,0.1)] bg-[rgba(255,252,247,0.99)] text-[#213238]",
        muted: "text-[rgba(18,52,60,0.56)]",
        rowLink: "hover:bg-[rgba(31,44,51,0.06)]",
        switchOn: "bg-[#d59a4f] text-[#1f2427]",
        switchOff: "text-[rgba(250,244,232,0.8)] hover:text-white",
      };

  const siteSwitcher = (
    <div className="inline-flex rounded-full bg-black/20 p-0.5" role="navigation" aria-label="Choose Store or Hotel">
      {[PUBLIC_SITE_KEYS.STORE, PUBLIC_SITE_KEYS.HOTEL].map((key) => {
        const option = getPublicSiteConfig(key);
        const isCurrent = key === activeSiteKey;
        return (
          <Link
            key={key}
            href={getPublicSitePath(key)}
            aria-current={isCurrent ? "page" : undefined}
            className={`rounded-full px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[0.16em] transition ${
              isCurrent ? theme.switchOn : theme.switchOff
            }`}
          >
            {option.shortLabel}
          </Link>
        );
      })}
    </div>
  );

  return (
    <>
      <header className={`${theme.header} sticky top-0 z-[100] w-full`}>
        <div className={theme.strip}>
          <Center>
            <div className="flex items-center justify-between gap-3 px-4 py-1.5 sm:px-6">
              {siteSwitcher}
              <div className="hidden items-center gap-5 text-xs font-medium sm:flex">
                <a href={`tel:${STORE_DETAILS.phoneNumbers[0]}`} className="inline-flex items-center gap-2 hover:underline">
                  <FontAwesomeIcon icon={faPhone} className="text-[0.7rem]" />
                  {STORE_DETAILS.phoneNumbers[0]}
                </a>
                <a href={`mailto:${STORE_DETAILS.email}`} className="hidden items-center gap-2 hover:underline lg:inline-flex">
                  <FontAwesomeIcon icon={faEnvelope} className="text-[0.7rem]" />
                  {STORE_DETAILS.email}
                </a>
              </div>
            </div>
          </Center>
        </div>

        <Center>
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <Link href={homeHref} className="flex min-w-0 items-center gap-3">
              <span className={`${theme.logo} shrink-0 rounded-2xl p-1.5`}>
                <Image
                  src="/images/st-micheals-logo.png"
                  alt="St. Michael's logo"
                  width={40}
                  height={40}
                  className="size-9 object-contain"
                />
              </span>
              <span className="min-w-0">
                <span className={`block truncate text-base font-bold sm:text-lg ${theme.name}`}>{site.displayName}</span>
                <span className={`hidden truncate text-[0.68rem] font-semibold uppercase tracking-[0.2em] sm:block ${theme.tagline}`}>
                  {site.tagLine}
                </span>
              </span>
            </Link>

            {!isHotelSite && (
              <form onSubmit={submitSearch} className="mx-2 hidden flex-1 lg:flex" role="search">
                <label className="sr-only" htmlFor="header-search">Search products</label>
                <div className="flex w-full items-center rounded-full border border-[rgba(31,44,51,0.14)] bg-white/90 pl-4 shadow-sm focus-within:border-[rgba(176,114,42,0.45)]">
                  <FontAwesomeIcon icon={faMagnifyingGlass} className="text-sm text-[rgba(18,52,60,0.5)]" />
                  <input
                    id="header-search"
                    type="search"
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder="Search groceries, drinks, essentials…"
                    className="w-full bg-transparent px-3 py-2.5 text-sm text-[var(--foreground-strong)] outline-none"
                  />
                  <button type="submit" className="store-button-accent m-1 rounded-full px-4 py-1.5 text-sm font-semibold">
                    Search
                  </button>
                </div>
              </form>
            )}

            <nav className={`ml-auto hidden items-center gap-1 text-sm font-semibold md:flex ${isHotelSite ? "" : "lg:ml-0"}`} aria-label="Main">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActiveRoute(link.href) ? "page" : undefined}
                  className={`rounded-full px-3.5 py-2 transition ${isActiveRoute(link.href) ? theme.active : theme.link}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-1">
              {primaryCta && (
                <Link
                  href={primaryCta.href}
                  className={`${theme.primary} hidden rounded-full px-4 py-2 text-sm font-semibold shadow-lg sm:inline-flex`}
                >
                  {primaryCta.label}
                </Link>
              )}

              {showCart && (
                <Link
                  href={cartHref}
                  data-cart-icon
                  aria-label={`Cart, ${cartCount || 0} item${cartCount === 1 ? "" : "s"}`}
                  className={`${theme.primary} relative inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold shadow-lg`}
                >
                  <FontAwesomeIcon icon={faCartShopping} />
                  <span className="hidden sm:inline">Cart</span>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">{cartCount || 0}</span>
                </Link>
              )}

              <button
                type="button"
                onClick={() => setNavOpen((open) => !open)}
                aria-controls="mobile-site-nav"
                aria-expanded={navOpen}
                aria-label={navOpen ? "Close menu" : "Open menu"}
                className={`${theme.secondary} inline-flex h-11 w-11 items-center justify-center rounded-full md:hidden`}
              >
                <FontAwesomeIcon icon={navOpen ? faTimes : faBars} />
              </button>
            </div>
          </div>
        </Center>

        {navOpen && (
          <div className="md:hidden">
            <button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 top-0 z-[-1] bg-black/30"
              onClick={() => setNavOpen(false)}
            />
            <nav
              id="mobile-site-nav"
              aria-label="Mobile"
              className={`mx-3 mb-3 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-3xl border p-3 shadow-2xl ${theme.panel}`}
            >
              {!isHotelSite && (
                <form onSubmit={submitSearch} className="mb-3" role="search">
                  <label className="sr-only" htmlFor="mobile-search">Search products</label>
                  <div className="flex items-center rounded-2xl border border-[rgba(31,44,51,0.14)] bg-white pl-3">
                    <FontAwesomeIcon icon={faMagnifyingGlass} className="text-sm text-[rgba(18,52,60,0.5)]" />
                    <input
                      id="mobile-search"
                      type="search"
                      value={searchText}
                      onChange={(event) => setSearchText(event.target.value)}
                      placeholder="Search products"
                      className="w-full bg-transparent px-3 py-3 text-sm outline-none"
                    />
                  </div>
                </form>
              )}

              <ul className="grid gap-1">
                {[{ href: homeHref, label: "Home" }, ...navLinks].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`flex items-center justify-between rounded-2xl px-4 py-3 text-base font-semibold ${
                        isActiveRoute(link.href) ? theme.active : theme.rowLink
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                {primaryCta && (
                  <li>
                    <Link href={primaryCta.href} className={`${theme.primary} mt-1 flex justify-center rounded-2xl px-4 py-3 text-base font-semibold`}>
                      {primaryCta.label}
                    </Link>
                  </li>
                )}
              </ul>

              <p className={`mt-4 px-4 text-[0.7rem] font-bold uppercase tracking-[0.2em] ${theme.muted}`}>Help</p>
              <ul className="mt-1 grid gap-1">
                {companyLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={`block rounded-2xl px-4 py-2.5 text-sm font-medium ${theme.rowLink}`}>
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <a href={`tel:${STORE_DETAILS.phoneNumbers[0]}`} className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium ${theme.rowLink}`}>
                    <FontAwesomeIcon icon={faPhone} /> Call {STORE_DETAILS.phoneNumbers[0]}
                  </a>
                </li>
                <li>
                  <a href={`mailto:${STORE_DETAILS.email}`} className={`flex items-center gap-3 break-all rounded-2xl px-4 py-2.5 text-sm font-medium ${theme.rowLink}`}>
                    <FontAwesomeIcon icon={faEnvelope} /> {STORE_DETAILS.email}
                  </a>
                </li>
              </ul>

              <div className="mt-4 flex items-center justify-between rounded-2xl bg-black/5 px-4 py-3">
                <span className={`text-sm font-medium ${theme.muted}`}>
                  {isHotelSite ? "Looking to shop?" : "Staying with us?"}
                </span>
                <Link
                  href={getPublicSitePath(isHotelSite ? PUBLIC_SITE_KEYS.STORE : PUBLIC_SITE_KEYS.HOTEL)}
                  className={`${theme.secondary} rounded-full px-4 py-2 text-sm font-semibold`}
                >
                  Go to {isHotelSite ? "Store" : "Hotel"}
                </Link>
              </div>

              {!isHotelSite && (
                <Link
                  href={getPublicScopedHref(activeSiteKey, "/account")}
                  className={`mt-2 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold ${theme.rowLink}`}
                >
                  <FontAwesomeIcon icon={faUser} /> My account &amp; orders
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      <MobileTabBar siteKey={activeSiteKey} cartCount={cartCount || 0} isActiveRoute={isActiveRoute} />
    </>
  );
}
