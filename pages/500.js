import Head from "next/head";
import Header from "@/components/Header";
import Center from "@/components/Center";
import Link from "next/link";

export default function Custom500() {
  return (
    <>
      <Head>
        <title>Server Error | St Michael&apos;s Store</title>
      </Head>
      <Header />
      <Center>
        <div className="flex min-h-screen items-center justify-center px-4 py-12">
          <div className="theme-shell-light max-w-md rounded-[2rem] p-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[rgba(18,52,60,0.52)]">
              Service interruption
            </p>
            <h1 className="mb-4 mt-4 text-6xl font-extrabold text-[var(--accent)]">500</h1>
            <h2 className="mb-4 text-2xl font-bold text-[var(--foreground-strong)]">
              Something Went Wrong
            </h2>
            <p className="mb-8 theme-muted-page">
              We&apos;re working on fixing this. Please try again later.
            </p>
            <Link
              href="/"
              className="theme-button-primary inline-block rounded-lg px-6 py-3 font-medium transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </Center>
    </>
  );
}
