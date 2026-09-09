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
  "block w-full rounded px-3 py-2 text-left text-sm text-neutral-200 transition hover:bg-neutral-800 hover:text-white";

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
    <header className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur">
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-5xl items-center gap-2 px-4 sm:gap-4"
      >
        <Link href="/" className="shrink-0 text-lg font-bold text-[#1DB954]">
          JamLink
        </Link>

        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {LINKS.map((l) => {
            const active = l.href.startsWith("/#") ? false : path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm transition ${
                  active
                    ? "bg-[#1DB954]/15 font-semibold text-[#1DB954]"
                    : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        <Link
          href="/new"
          className="shrink-0 rounded-full bg-[#1DB954] px-4 py-2 text-sm font-bold text-black transition hover:brightness-110 active:scale-[0.98]"
        >
          Post a Jam
        </Link>

        {/* ponytail: reserve the slot until auth resolves so the nav does not jump. */}
        {!ready ? (
          <div aria-hidden className="h-9 w-9 shrink-0 rounded-full bg-neutral-800" />
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
                className="absolute right-0 mt-2 w-52 rounded-lg border border-neutral-800 bg-neutral-900 p-1 shadow-xl"
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
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/login"
              className="hidden px-2 py-2 text-sm text-neutral-400 transition hover:text-white sm:block"
            >
              Log in
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-neutral-700 px-4 py-2 text-sm font-semibold text-neutral-100 transition hover:border-neutral-500 active:scale-[0.98]"
            >
              Sign up
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
