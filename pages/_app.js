import CartProvider from "@/components/CartContext";
import AppLoaderOverlay from "@/components/AppLoaderOverlay";
import Footer from "@/components/Footer";
import "@/styles/globals.css";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Sora, Rajdhani } from "next/font/google";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sans",
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const hideFooter = Component.hideFooter === true;
  const [isBootLoading, setIsBootLoading] = useState(true);
  const [isRouteLoading, setIsRouteLoading] = useState(false);

  useEffect(() => {
    const bootTimer = window.setTimeout(() => {
      setIsBootLoading(false);
    }, 450);

    return () => {
      window.clearTimeout(bootTimer);
    };
  }, []);

  useEffect(() => {
    let routeTimer;

    const handleStart = () => {
      window.clearTimeout(routeTimer);
      routeTimer = window.setTimeout(() => {
        setIsRouteLoading(true);
      }, 120);
    };

    const handleStop = () => {
      window.clearTimeout(routeTimer);
      setIsRouteLoading(false);
    };

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleStop);
    router.events.on("routeChangeError", handleStop);

    return () => {
      window.clearTimeout(routeTimer);
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleStop);
      router.events.off("routeChangeError", handleStop);
    };
  }, [router.events]);

  const showLoader = isBootLoading || isRouteLoading;

  return (
    <>
      <Head>
        <title>St Michael&apos;s Store</title>
        <meta
          name="description"
          content="Premium groceries, everyday essentials, and streamlined delivery from St Michael&apos;s Store."
        />
        <meta name="theme-color" content="#f8f1e4" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta property="og:title" content="St Michael&apos;s Store" />
        <meta
          property="og:description"
          content="Discover premium groceries, curated essentials, and secure checkout in one storefront."
        />
        <meta property="og:type" content="website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <CartProvider>
        <div className={`${sora.variable} ${rajdhani.variable} app-shell`}>
          {showLoader && <AppLoaderOverlay />}
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>
          <main id="main-content" className="site-main">
            <Component {...pageProps} />
          </main>
          {!hideFooter && <Footer />}
        </div>
      </CartProvider>
    </>
  );
}
