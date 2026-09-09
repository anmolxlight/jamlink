"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

const LINKS = [
  { href: "/feed", label: "Explore" },
  { href: "/trending", label: "Trending" },
  { href: "/#genres", label: "Genres" },
  { href: "/search", label: "Search" },
];

const MENU_ITEM =
  "block w-full rounded-lg px-3 py-2 text-left text-sm text-neutral-200 transition hover:bg-white/10 hover:text-white";

export function SiteNav() {
  const path = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setReady(true);
      return;
    }
    sb.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setReady(true);
    });
    // Keeps the nav honest after a magic-link sign in or a sign out in another tab.
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Close the account menu whenever the route changes.
  useEffect(() => setOpen(false), [path]);

  async function logOut() {
    setOpen(false);
    await getSupabase()?.auth.signOut();
    router.push("/");
  }

  return (
    <header className="pointer-events-none fixed inset-x-0 top-4 z-50 px-4">
      <nav
        aria-label="Main"
        className="pointer-events-auto mx-auto flex h-16 w-full max-w-6xl items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 backdrop-blur-xl sm:gap-4 sm:px-5"
      >
        <Link href="/" className="shrink-0 pl-1 text-lg font-bold tracking-tight text-neutral-100">
          Jam<span className="text-[#1DB954]">Link</span>
        </Link>

        {/* ponytail: below md the four links collapse to the Explore hub, which is
            where genres and trending are reachable from anyway. Keeps one 64px line. */}
        <Link
          href="/feed"
          className="ml-auto rounded-full px-3 py-1.5 text-sm text-neutral-300 transition hover:text-white md:hidden"
        >
          Explore
        </Link>

        <div className="mx-auto hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const active = l.href.startsWith("/#") ? false : path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  active
                    ? "bg-white/10 font-semibold text-white"
                    : "text-neutral-400 hover:bg-white/5 hover:text-neutral-100"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        <Link
          href="/new"
          className="shrink-0 rounded-full bg-[#1DB954] px-4 py-2.5 text-sm font-bold text-black transition hover:brightness-110 active:scale-[0.98] sm:px-5"
        >
          Post a Jam
        </Link>

        {/* ponytail: reserve the slot until auth resolves so the nav does not jump. */}
        {!ready ? (
          <div aria-hidden className="h-9 w-9 shrink-0 rounded-full bg-white/10" />
        ) : email ? (
          <div
            ref={wrap}
            className="relative shrink-0"
            onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
            onBlur={(e) => {
              if (!wrap.current?.contains(e.relatedTarget as Node)) setOpen(false);
            }}
          >
            <button
              onClick={() => setOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={open}
              aria-label={`Account menu for ${email}`}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1DB954] text-sm font-bold uppercase text-black transition hover:brightness-110"
            >
              {email[0]}
            </button>
            {open && (
              <div
                role="menu"
                className="absolute right-0 mt-3 w-56 rounded-2xl border border-white/10 bg-[#101010] p-1.5 shadow-2xl"
              >
                <p className="truncate px-3 py-2 text-xs text-neutral-500">{email}</p>
                <Link href="/profile" role="menuitem" className={MENU_ITEM}>
                  Profile
                </Link>
                <Link href="/my-jams" role="menuitem" className={MENU_ITEM}>
                  My Jams
                </Link>
                <button onClick={logOut} role="menuitem" className={MENU_ITEM}>
                  Log out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-1">
            <Link
              href="/login"
              className="hidden rounded-full px-3 py-2 text-sm text-neutral-400 transition hover:text-white md:block"
            >
              Log in
            </Link>
            {/* ponytail: below sm the pill only has room for logo, Explore and the CTA. */}
            <Link
              href="/login"
              className="hidden rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-neutral-100 transition hover:border-white/35 hover:bg-white/5 active:scale-[0.98] sm:block"
            >
              Sign up
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
