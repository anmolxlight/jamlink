"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase, type Jam } from "@/lib/supabase";
import { GENRES, GENRE_BLURB, GENRE_LABEL } from "@/lib/spotify";
import { hasStats, jamStats } from "@/lib/stats";
import { Equalizer, NoEnvNotice } from "./components/jam-ui";

const CTA =
  "inline-flex items-center justify-center rounded-full bg-[#1DB954] px-7 py-3 text-sm font-bold text-black transition hover:brightness-110 active:scale-[0.98]";
const CTA_SECONDARY =
  "inline-flex items-center justify-center rounded-full border border-neutral-700 px-7 py-3 text-sm font-semibold text-neutral-100 transition hover:border-neutral-500 active:scale-[0.98]";

// Verb-led, no numbered labels. The order is the instruction.
const STEPS = [
  { verb: "Start a jam in Spotify", body: "Open a jam in the Spotify app and copy the invite link." },
  { verb: "Post it with a genre", body: "Give it a title and a genre so the right people can find it." },
  { verb: "Let listeners join", body: "Anyone browsing that genre can tap through and drop straight in." },
];

export default function Home() {
  const [jams, setJams] = useState<Jam[]>([]);
  const [loading, setLoading] = useState(true);
  const [noEnv, setNoEnv] = useState(false);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setNoEnv(true);
      setLoading(false);
      return;
    }
    // ponytail: one query feeds the stats strip, the trending preview and the genre counts.
    sb.from("jams")
      .select("*")
      .eq("is_open", true)
      .order("member_count", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setJams((data ?? []) as Jam[]);
        setLoading(false);
      });
  }, []);

  const stats = jamStats(jams);
  const trending = jams.slice(0, 5);
  const perGenre = new Map<string, number>();
  for (const j of jams) perGenre.set(j.genre, (perGenre.get(j.genre) ?? 0) + 1);

  return (
    <div className="space-y-16 py-4">
      <section>
        <div className="flex items-center gap-3">
          <Equalizer />
          <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
            Listen together on Spotify
          </span>
        </div>
        <h1 className="mt-4 max-w-2xl text-4xl font-bold leading-[1.1] tracking-tight md:text-6xl">
          Every open Spotify jam, in one place.
        </h1>
        <p className="mt-4 max-w-lg text-base text-neutral-400">
          Browse live listening rooms by genre, join with one tap, or open your own for anyone to find.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link href="/new" className={CTA}>
            Post a Jam
          </Link>
          <Link href="/feed" className={CTA_SECONDARY}>
            Explore jams
          </Link>
        </div>
      </section>

      {noEnv && <NoEnvNotice />}

      {/* Real counts only. Nothing to count means no strip, never a row of zeroes. */}
      {!loading && hasStats(stats) && (
        <section className="grid grid-cols-3 divide-x divide-neutral-800 rounded-xl border border-neutral-800 bg-neutral-900">
          {[
            { value: stats.openJams, label: stats.openJams === 1 ? "open jam" : "open jams" },
            { value: stats.members, label: stats.members === 1 ? "listener" : "listeners" },
            { value: stats.genres, label: stats.genres === 1 ? "genre covered" : "genres covered" },
          ].map((s) => (
            <div key={s.label} className="px-4 py-5 text-center">
              <div className="text-2xl font-bold tabular-nums text-[#1DB954] md:text-3xl">{s.value}</div>
              <div className="mt-1 text-xs text-neutral-400">{s.label}</div>
            </div>
          ))}
        </section>
      )}

      <section>
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="text-2xl font-bold tracking-tight">Trending now</h2>
          {trending.length > 0 && (
            <Link href="/trending" className="ml-auto text-sm font-semibold text-[#1DB954] hover:underline">
              See the full ranking
            </Link>
          )}
        </div>

        {loading ? (
          <ul className="mt-4 space-y-2" aria-label="Loading trending jams">
            {[0, 1, 2].map((i) => (
              <li key={i} aria-hidden className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                <div className="jl-skeleton h-5 w-2/3 rounded" />
                <div className="jl-skeleton mt-2 h-4 w-1/3 rounded" />
              </li>
            ))}
          </ul>
        ) : trending.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-neutral-800 bg-neutral-900/50 p-8 text-center">
            <p className="font-semibold">No jams are open yet.</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-neutral-400">
              JamLink is brand new. The first jam posted here is the one everyone sees.
            </p>
            <Link href="/new" className={`${CTA} mt-5`}>
              Post the first jam
            </Link>
          </div>
        ) : (
          <ol className="mt-4 space-y-2">
            {trending.map((j, i) => (
              <li
                key={j.id}
                className="flex items-center gap-4 rounded-lg border border-neutral-800 bg-neutral-900 p-4 transition hover:border-neutral-600"
              >
                <span
                  aria-hidden
                  className={`w-6 shrink-0 text-right text-lg font-bold tabular-nums ${
                    i < 3 ? "text-[#1DB954]" : "text-neutral-500"
                  }`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={`/jam/${j.id}`} className="block truncate font-semibold hover:text-[#1DB954]">
                    <span className="sr-only">Rank {i + 1}. </span>
                    {j.title}
                  </Link>
                  <p className="mt-0.5 truncate text-sm text-neutral-400">
                    {GENRE_LABEL[j.genre as keyof typeof GENRE_LABEL] ?? j.genre}
                  </p>
                </div>
                <span className="shrink-0 text-right">
                  <span className="block font-bold tabular-nums">{j.member_count}</span>
                  <span className="block text-xs text-neutral-400">
                    {j.member_count === 1 ? "member" : "members"}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section id="genres" className="scroll-mt-20">
        <h2 className="text-2xl font-bold tracking-tight">Browse by genre</h2>
        <p className="mt-2 max-w-lg text-sm text-neutral-400">
          Thirteen rooms. Pick the one you already have on repeat.
        </p>
        <ul className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {GENRES.map((g) => {
            const n = perGenre.get(g) ?? 0;
            return (
              <li key={g}>
                <Link
                  href={`/genre/${g}`}
                  className="flex h-full flex-col rounded-lg border border-neutral-800 bg-neutral-900 p-4 transition hover:border-[#1DB954]/50 hover:bg-neutral-800/60"
                >
                  <span className="flex items-center gap-2 font-semibold">
                    {GENRE_LABEL[g]}
                    {n > 0 && (
                      <span className="rounded-full bg-[#1DB954]/15 px-2 py-0.5 text-xs font-bold tabular-nums text-[#1DB954]">
                        {n}
                      </span>
                    )}
                  </span>
                  <span className="mt-1 text-sm text-neutral-400">{GENRE_BLURB[g]}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold tracking-tight">How it works</h2>
        <ol className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.verb} className="rounded-lg border border-neutral-800 bg-neutral-900 p-5">
              <Equalizer className="mb-3" />
              <h3 className="font-semibold">{s.verb}</h3>
              <p className="mt-1 text-sm text-neutral-400">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
