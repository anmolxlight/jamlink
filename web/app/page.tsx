"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase, type Jam } from "@/lib/supabase";
import { GENRES, GENRE_BLURB, GENRE_LABEL, type Genre } from "@/lib/spotify";
import { picsum } from "@/lib/img";
import { Equalizer, NoEnvNotice } from "./components/jam-ui";
import { PinnedJamRail, ScrubReveal } from "./components/home-motion";

const CTA =
  "inline-flex items-center justify-center rounded-full bg-[#1DB954] px-8 py-4 text-sm font-bold text-black transition hover:brightness-110 active:scale-[0.98]";
const CTA_GLASS =
  "inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-8 py-4 text-sm font-semibold text-white backdrop-blur transition hover:border-white/40 hover:bg-white/10 active:scale-[0.98]";

const PILL =
  "mx-1.5 inline-block h-[0.7em] w-[1.85em] translate-y-[0.02em] rounded-full bg-cover bg-center align-middle grayscale contrast-125 brightness-125 ring-1 ring-white/25 md:mx-3";

// Verb-led. The order is the instruction, so no numbers are printed.
const STEPS = [
  {
    verb: "Open a jam in Spotify",
    body: "Start a jam from any device and copy the invite link Spotify hands you.",
  },
  {
    verb: "Post it under a genre",
    body: "Title it, pick the genre it actually sounds like, and it goes live here.",
  },
  {
    verb: "Strangers walk in",
    body: "Anyone browsing that genre taps through and lands in your queue.",
  },
];

const DEFAULT_TILES: Genre[] = ["hip-hop", "edm", "lofi"];

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
    // ponytail: one query feeds the live count, the genre tiles and the pinned rail.
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

  const perGenre = new Map<string, number>();
  for (const j of jams) perGenre.set(j.genre, (perGenre.get(j.genre) ?? 0) + 1);

  // Busiest genres first, topped up with defaults so the grid never has a hole.
  const tiles = Array.from(
    new Set([
      ...[...perGenre.entries()].sort((a, b) => b[1] - a[1]).map(([g]) => g),
      ...DEFAULT_TILES,
    ]),
  ).slice(0, 3);

  const open = jams.length;
  // The count cell only exists when there is a real number to show. Both grid
  // states are solved: 5+4+3 and 7+5 across twelve columns, no voids either way.
  const live = !loading && open > 0;
  const cellA = live ? "md:col-span-5" : "md:col-span-7";
  const cellB = live ? "md:col-span-4" : "md:col-span-5";

  return (
    <div data-bleed className="w-full max-w-full">
      {/* Attention */}
      <section className="jl-grain relative flex min-h-[100svh] items-center overflow-hidden px-6 pt-32 pb-24">
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center opacity-45 grayscale contrast-125 mix-blend-luminosity"
          style={{ backgroundImage: `url(${picsum("basement-club-night", 1920, 1080)})` }}
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 30%, rgba(10,10,10,0.25) 0%, rgba(10,10,10,0.82) 55%, #0a0a0a 100%)",
          }}
        />
        <div className="relative mx-auto w-full max-w-6xl text-center">
          <h1 className="text-[clamp(1.8rem,6.2vw,6.25rem)] font-bold leading-[1.02] tracking-[-0.03em]">
            Walk into a secret
            <span
              className={PILL}
              aria-hidden
              style={{ backgroundImage: `url(${picsum("stage-lights-warm", 400, 260)})` }}
            />
            listening room, anywhere
            <span
              className={PILL}
              aria-hidden
              style={{ backgroundImage: `url(${picsum("city-window-night", 400, 260)})` }}
            />
            on earth.
          </h1>
          <p className="mx-auto mt-8 max-w-xl text-base text-neutral-300 md:text-lg">
            Open Spotify jams, posted by strangers, sorted by genre. No invite, no waiting list, no
            account needed to look around.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/new" className={CTA}>
              Post a Jam
            </Link>
            <Link href="/feed" className={CTA_GLASS}>
              Explore jams
            </Link>
          </div>
        </div>
      </section>

      {noEnv && (
        <div className="mx-auto max-w-6xl px-6 pt-10">
          <NoEnvNotice />
        </div>
      )}

      {/* Interest */}
      <section id="genres" className="scroll-mt-28 px-6 py-32 md:py-48">
        <div className="mx-auto max-w-6xl">
          <h2 className="max-w-3xl text-[clamp(2rem,3.6vw,3.5rem)] font-bold leading-[1.06] tracking-tight">
            Pick a sound, find the room, drop into the queue.
          </h2>

          <div className="mt-14 grid grid-flow-dense grid-cols-1 gap-px overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 md:auto-rows-[11rem] md:grid-cols-12">
            {/* How joining works, as slices that open on hover. */}
            <div className={`${cellA} flex flex-col bg-[#0a0a0a] p-7 md:row-span-2 md:p-9`}>
              <h3 className="text-xl font-bold tracking-tight md:text-2xl">
                Joining takes one tap.
              </h3>
              <div className="mt-6 flex min-h-0 flex-1 flex-col gap-px overflow-hidden rounded-2xl bg-white/10 md:flex-row">
                {STEPS.map((s) => (
                  <div
                    key={s.verb}
                    className="group flex flex-1 flex-col justify-end bg-[#101010] p-5 transition-[flex-grow] duration-500 ease-out hover:bg-[#141414] md:hover:flex-[2.4]"
                  >
                    <Equalizer className="mb-3" />
                    <p className="text-sm font-semibold leading-snug text-neutral-100">{s.verb}</p>
                    {/* ponytail: mobile has no hover, so the body is always visible below md. */}
                    <p className="mt-2 text-xs leading-relaxed text-neutral-400 md:max-h-0 md:overflow-hidden md:opacity-0 md:transition-all md:duration-500 md:group-hover:max-h-24 md:group-hover:opacity-100">
                      {s.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <GenreCell
              slug={tiles[0]}
              count={perGenre.get(tiles[0]) ?? 0}
              className={`${cellB} md:row-span-2`}
            />

            {live && (
              <div className="flex flex-col justify-between bg-[#0a0a0a] p-7 md:col-span-3 md:row-span-2 md:p-9">
                <Equalizer />
                <div>
                  <p className="text-[clamp(3rem,5vw,4.75rem)] font-bold leading-none tabular-nums tracking-tighter text-[#1DB954]">
                    {open}
                  </p>
                  <p className="mt-3 text-sm text-neutral-400">
                    {open === 1 ? "jam is open" : "jams are open"} at this exact moment across{" "}
                    {perGenre.size} {perGenre.size === 1 ? "genre" : "genres"}.
                  </p>
                </div>
              </div>
            )}

            <GenreCell
              slug={tiles[1]}
              count={perGenre.get(tiles[1]) ?? 0}
              className="md:col-span-7 md:row-span-2"
            />
            <GenreCell
              slug={tiles[2]}
              count={perGenre.get(tiles[2]) ?? 0}
              className="md:col-span-5 md:row-span-2"
            />
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {GENRES.map((g) => (
              <Link
                key={g}
                href={`/genre/${g}`}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-neutral-400 transition hover:border-white/30 hover:bg-white/5 hover:text-neutral-100"
              >
                {GENRE_LABEL[g]}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Desire */}
      <div className="relative flex overflow-hidden border-y border-white/10 py-8">
        <div className="jl-marquee flex w-max shrink-0 items-center">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
              {GENRES.map((g) => (
                <span
                  key={g}
                  className="flex shrink-0 items-center text-[clamp(1.75rem,3.4vw,3.25rem)] font-bold uppercase tracking-tight text-neutral-700"
                >
                  {GENRE_LABEL[g]}
                  <span className="mx-6 h-2 w-2 shrink-0 rounded-full bg-[#1DB954] md:mx-10" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <PinnedJamRail jams={jams.slice(0, 6)} loading={loading} />

      <section className="px-0 py-32 md:py-48">
        <ScrubReveal text="Nobody schedules a listening room. Someone just opens one, plays what they are playing, and leaves the door unlocked for whoever wanders past." />
      </section>

      {/* Action */}
      <section className="px-6 pb-32 md:pb-48">
        <div className="jl-grain relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] border border-white/10 px-6 py-24 text-center md:py-36">
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-center opacity-20 grayscale contrast-125 mix-blend-luminosity"
            style={{ backgroundImage: `url(${picsum("crowd-hands-lights", 1920, 1080)})` }}
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(100% 100% at 50% 50%, rgba(10,10,10,0.35) 0%, rgba(10,10,10,0.9) 70%, #0a0a0a 100%)",
            }}
          />
          <div className="relative mx-auto max-w-4xl">
            <h2 className="text-[clamp(2.4rem,6vw,5.5rem)] font-bold leading-[1.02] tracking-[-0.03em]">
              The next room is one link away.
            </h2>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/new" className={CTA}>
                {live ? "Post a Jam" : "Post the first jam"}
              </Link>
              <Link href="/feed" className={CTA_GLASS}>
                Explore jams
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function GenreCell({ slug, count, className }: { slug: string; count: number; className: string }) {
  const label = GENRE_LABEL[slug as Genre] ?? slug;
  return (
    <Link
      href={`/genre/${slug}`}
      className={`group relative flex min-h-[14rem] items-end overflow-hidden bg-[#0a0a0a] ${className}`}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center opacity-60 grayscale contrast-125 mix-blend-luminosity transition-transform duration-700 ease-out group-hover:scale-105"
        style={{ backgroundImage: `url(${picsum(`genre-${slug}`, 1200, 800)})` }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent"
      />
      <div className="relative w-full p-7 md:p-9">
        <div className="flex items-center gap-3">
          <h3 className="text-2xl font-bold tracking-tight md:text-3xl">{label}</h3>
          {count > 0 && (
            <span className="rounded-full bg-[#1DB954] px-2.5 py-0.5 text-xs font-bold tabular-nums text-black">
              {count} live
            </span>
          )}
        </div>
        <p className="mt-1.5 max-w-sm text-sm text-neutral-400">
          {GENRE_BLURB[slug as Genre] ?? "Everything that refuses a label."}
        </p>
      </div>
    </Link>
  );
}
