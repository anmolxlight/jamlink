import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "./components/toast";
import { SiteNav } from "./components/nav";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

const site = "JamLink";
const desc = "Find an open Spotify jam by genre and join in one tap.";

// ponytail: Vercel injects the production domain, so no URL is hardcoded here.
const origin = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  title: { default: site, template: `%s | ${site}` },
  description: desc,
  metadataBase: new URL(origin),
  openGraph: {
    title: site,
    description: desc,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: site,
    description: desc,
  },
};

const FOOT_LINK = "shrink-0 transition hover:text-neutral-200";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${geist.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-neutral-950 font-[family-name:var(--font-geist)] text-neutral-100 antialiased">
        <ToastProvider>
          <SiteNav />
          <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
          <footer className="mt-16 border-t border-neutral-800">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-6 text-xs text-neutral-400">
              <span className="font-semibold text-neutral-200">JamLink</span>
              <Link href="/feed" className={FOOT_LINK}>
                Explore
              </Link>
              <Link href="/trending" className={FOOT_LINK}>
                Trending
              </Link>
              <Link href="/#genres" className={FOOT_LINK}>
                Genres
              </Link>
              <Link href="/new" className={FOOT_LINK}>
                Post a Jam
              </Link>
              <a
                href="https://open.spotify.com"
                target="_blank"
                rel="noreferrer"
                className={`${FOOT_LINK} sm:ml-auto`}
              >
                Spotify
              </a>
            </div>
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
