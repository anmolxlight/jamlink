import type { Metadata } from "next";
import Link from "next/link";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "./components/toast";
import { SiteNav } from "./components/nav";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });

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

const FOOT_LINK = "transition hover:text-neutral-100";

const FOOT_COLS = [
  {
    head: "Listen",
    links: [
      { href: "/feed", label: "Explore" },
      { href: "/trending", label: "Trending" },
      { href: "/#genres", label: "Genres" },
      { href: "/search", label: "Search" },
    ],
  },
  {
    head: "Host",
    links: [
      { href: "/new", label: "Post a Jam" },
      { href: "/my-jams", label: "My Jams" },
      { href: "/profile", label: "Profile" },
      { href: "/login", label: "Log in" },
    ],
  },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${display.variable}`}>
      <body className="min-h-screen bg-[#0a0a0a] font-[family-name:var(--font-display)] text-neutral-100 antialiased">
        <ToastProvider>
          <SiteNav />
          {/* The homepage opts out of this shell with data-bleed (see globals.css). */}
          <main className="mx-auto w-full max-w-5xl overflow-x-hidden px-4 pt-28 pb-6">{children}</main>
          <footer className="border-t border-white/10 bg-[#0a0a0a]">
            <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-10 px-6 py-16 text-sm text-neutral-400 md:grid-cols-4">
              <div className="col-span-2 md:col-span-2">
                <Link href="/" className="text-2xl font-bold tracking-tight text-neutral-100">
                  Jam<span className="text-[#1DB954]">Link</span>
                </Link>
                <p className="mt-3 max-w-xs text-neutral-500">
                  Open Spotify listening rooms, sorted by genre, open to anyone who finds them.
                </p>
              </div>
              {FOOT_COLS.map((c) => (
                <div key={c.head}>
                  <p className="font-semibold text-neutral-200">{c.head}</p>
                  <ul className="mt-4 space-y-2.5">
                    {c.links.map((l) => (
                      <li key={l.href}>
                        <Link href={l.href} className={FOOT_LINK}>
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 px-6 py-6 text-xs text-neutral-600">
              <span>JamLink is not affiliated with Spotify.</span>
              <a
                href="https://open.spotify.com"
                target="_blank"
                rel="noreferrer"
                className={`${FOOT_LINK} sm:ml-auto`}
              >
                Open Spotify
              </a>
            </div>
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
