import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faBed, faCartShopping } from "@fortawesome/free-solid-svg-icons";
import Center from "@/components/Center";
import { STORE_DETAILS } from "@/lib/storeDetails";
import { PUBLIC_SITE_KEYS, getPublicSiteConfig, getPublicSitePath } from "@/lib/publicSite";

const store = getPublicSiteConfig(PUBLIC_SITE_KEYS.STORE);
const hotel = getPublicSiteConfig(PUBLIC_SITE_KEYS.HOTEL);

/** Front door: pick the Store or the Hotel. */
export default function LandingGateway() {
  return (
    <>
      <Head>
        <title>St Michael&apos;s</title>
        <meta name="description" content="Shop groceries and drinks, or book a room and a table at St Michael's." />
      </Head>

      <Center>
        <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:px-8">
          <Image
            src="/images/st-micheals-logo.png"
            alt="St. Michael's logo"
            width={96}
            height={96}
            priority
            className="h-20 w-20 object-contain sm:h-24 sm:w-24"
          />
          <h1 className="mt-5 text-center text-3xl font-extrabold text-[var(--foreground-strong)] sm:text-5xl">
            Welcome to St Michael&apos;s
          </h1>
          <p className="mt-3 max-w-xl text-center text-base theme-muted-page sm:text-lg">
            What would you like to do today?
          </p>

          <div className="mt-8 grid w-full max-w-4xl gap-4 sm:grid-cols-2">
            <Link
              href={getPublicSitePath(PUBLIC_SITE_KEYS.STORE)}
              className="store-shell group flex flex-col rounded-[1.75rem] p-6 transition hover:-translate-y-1 sm:p-8"
            >
              <span className="store-tag inline-flex size-12 items-center justify-center rounded-2xl text-xl">
                <FontAwesomeIcon icon={faCartShopping} />
              </span>
              <h2 className="mt-5 text-2xl font-bold text-[var(--foreground-strong)]">Shop the store</h2>
              <p className="mt-2 flex-1 text-sm leading-6 store-shell-muted">{store.tagLine}. Order online for delivery.</p>
              <span className="store-button-accent mt-6 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold">
                Start shopping <FontAwesomeIcon icon={faArrowRight} className="transition group-hover:translate-x-1" />
              </span>
            </Link>

            <Link
              href={getPublicSitePath(PUBLIC_SITE_KEYS.HOTEL)}
              className="hotel-shell group flex flex-col rounded-[1.75rem] p-6 transition hover:-translate-y-1 sm:p-8"
            >
              <span className="hotel-shell-kicker inline-flex size-12 items-center justify-center rounded-2xl text-xl">
                <FontAwesomeIcon icon={faBed} />
              </span>
              <h2 className="mt-5 text-2xl font-bold text-[#fff1dc]">Stay at the hotel</h2>
              <p className="mt-2 flex-1 text-sm leading-6 hotel-shell-muted">{hotel.tagLine}. Book directly with us.</p>
              <span className="hotel-button-primary mt-6 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold">
                Explore the hotel <FontAwesomeIcon icon={faArrowRight} className="transition group-hover:translate-x-1" />
              </span>
            </Link>
          </div>

          <p className="mt-8 text-center text-sm theme-muted-page">
            Need help? Call{" "}
            <a href={`tel:${STORE_DETAILS.phoneNumbers[0]}`} className="font-semibold text-[#8d5a1f]">
              {STORE_DETAILS.phoneNumbers[0]}
            </a>{" "}
            or email{" "}
            <a href={`mailto:${STORE_DETAILS.email}`} className="font-semibold text-[#8d5a1f]">
              {STORE_DETAILS.email}
            </a>
          </p>
        </div>
      </Center>
    </>
  );
}
