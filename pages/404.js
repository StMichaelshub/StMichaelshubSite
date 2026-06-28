import Head from "next/head";
import Header from "@/components/Header";
import Center from "@/components/Center";
import Link from "next/link";

export default function Custom404() {
  return (
    <>
      <Head>
        <title>Page Not Found | St Michael&apos;s Store</title>
      </Head>
      <Header />
      <Center>
        <div className="flex min-h-screen items-center justify-center px-4 py-12">
          <div className="theme-shell-light max-w-md rounded-[2rem] p-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[rgba(18,52,60,0.52)]">
              Navigation error
            </p>
            <h1 className="mb-4 mt-4 text-6xl font-extrabold text-[var(--accent)]">404</h1>
            <h2 className="mb-4 text-2xl font-bold text-[var(--foreground-strong)]">
              Page Not Found
            </h2>
            <p className="mb-8 theme-muted-page">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
            <Link
              href="/"
              className="theme-button-accent inline-block rounded-lg px-6 py-3 font-medium transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </Center>
    </>
  );
}
