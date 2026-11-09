import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBed,
  faCalendarCheck,
  faCartShopping,
  faHouse,
  faListUl,
  faStore,
  faUser,
  faUtensils,
} from "@fortawesome/free-solid-svg-icons";
import { PUBLIC_SITE_KEYS, getPublicScopedHref, getPublicSitePath } from "@/lib/publicSite";

const STORE_TABS = [
  { href: "/", label: "Home", icon: faHouse },
  { href: "/products", label: "Shop", icon: faStore },
  { href: "/categories", label: "Categories", icon: faListUl },
  { href: "/cart", label: "Cart", icon: faCartShopping, showsCartCount: true },
  { href: "/account", label: "Account", icon: faUser },
];

const HOTEL_TABS = [
  { href: "/", label: "Home", icon: faHouse },
  { href: "/rooms", label: "Rooms", icon: faBed },
  { href: "/booking", label: "Book", icon: faCalendarCheck },
  { href: "/lounge", label: "Lounge", icon: faUtensils },
  { href: "/manage-bookings", label: "My bookings", icon: faListUl },
];

/** Bottom tab bar on phones: the main pages are always one tap away. */
export default function MobileTabBar({ siteKey, cartCount = 0, isActiveRoute }) {
  const isHotelSite = siteKey === PUBLIC_SITE_KEYS.HOTEL;
  const tabs = (isHotelSite ? HOTEL_TABS : STORE_TABS).map((tab) => ({
    ...tab,
    href: tab.href === "/" ? getPublicSitePath(siteKey) : getPublicScopedHref(siteKey, tab.href),
  }));

  return (
    <nav
      aria-label="Quick navigation"
      className={`mobile-tabbar fixed inset-x-0 bottom-0 z-[95] border-t md:hidden ${
        isHotelSite
          ? "border-[rgba(216,172,79,0.18)] bg-[rgba(13,18,22,0.97)] text-[rgba(245,238,226,0.7)]"
          : "border-[rgba(31,44,51,0.1)] bg-[rgba(255,252,247,0.98)] text-[rgba(18,52,60,0.62)]"
      }`}
    >
      <ul className="grid grid-cols-5">
        {tabs.map((tab) => {
          const active = isActiveRoute?.(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                {...(tab.showsCartCount ? { "data-cart-icon": true } : {})}
                className={`flex flex-col items-center gap-1 px-1 pb-2 pt-2.5 text-[0.68rem] font-semibold ${
                  active ? (isHotelSite ? "text-[#f8d78f]" : "text-[#8d5a1f]") : ""
                }`}
              >
                <span className="relative">
                  <FontAwesomeIcon icon={tab.icon} className="text-lg" />
                  {tab.showsCartCount && cartCount > 0 && (
                    <span className="absolute -right-3 -top-2 rounded-full bg-[#b0722a] px-1.5 text-[0.6rem] font-bold leading-4 text-white">
                      {cartCount}
                    </span>
                  )}
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
