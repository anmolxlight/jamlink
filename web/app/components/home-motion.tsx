"use client";
// GSAP-driven homepage sections. Isolated here so the rest of the page stays
// plain markup and the animation code has exactly one cleanup surface.
//
// Reduced motion: every tween lives inside gsap.matchMedia("(prefers-reduced-motion:
// no-preference)"). Initial states are set by GSAP, never by CSS, so a user who
// prefers reduced motion gets the finished layout with nothing hidden.
import { useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { Jam } from "@/lib/supabase";
import { GENRE_LABEL } from "@/lib/spotify";
import { timeAgo } from "@/lib/time";
import { picsum } from "@/lib/img";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const OK_MOTION = "(prefers-reduced-motion: no-preference)";

export function PinnedJamRail({ jams, loading }: { jams: Jam[]; loading: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const pin = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Nothing to scroll past when the rail is empty or still loading.
      if (loading || jams.length === 0) return;
      const mm = gsap.matchMedia();

      mm.add(`(min-width: 768px) and ${OK_MOTION}`, () => {
        ScrollTrigger.create({
          trigger: grid.current,
          start: "top top",
          end: "bottom bottom",
          pin: pin.current,
          pinSpacing: false,
        });
      });

      mm.add(OK_MOTION, () => {
        const cards = root.current?.querySelectorAll<HTMLElement>("[data-rail-card]") ?? [];
        for (const card of cards) {
          const art = card.querySelector("[data-rail-art]");
          gsap.fromTo(
            card,
            { opacity: 0.2, y: 40 },
            {
              opacity: 1,
              y: 0,
              ease: "none",
              scrollTrigger: { trigger: card, start: "top bottom", end: "center 62%", scrub: true },
            },
          );
          gsap.fromTo(
            art,
            { scale: 0.8 },
            {
              scale: 1,
              ease: "none",
              scrollTrigger: { trigger: card, start: "top bottom", end: "center 62%", scrub: true },
            },
          );
          // Darken and drop away once the card has been read.
          gsap.to(card, {
            opacity: 0.35,
            ease: "none",
            scrollTrigger: { trigger: card, start: "top 8%", end: "bottom top", scrub: true },
          });
        }
      });

      return () => mm.revert();
    },
    { scope: root, dependencies: [jams.length, loading] },
  );

  return (
    <section ref={root} className="relative px-6 py-32 md:py-48">
      <div ref={grid} className="mx-auto grid max-w-6xl gap-10 md:grid-cols-12 md:gap-16">
        <div className="md:col-span-5">
          {/* Only claim a full viewport when there is a rail to scroll against it. */}
          <div
            ref={pin}
            className={`flex flex-col justify-center ${jams.length > 0 ? "md:h-screen" : ""}`}
          >
            <h2 className="text-[clamp(2.25rem,4vw,3.75rem)] font-bold leading-[1.02] tracking-tight">
              Rooms that are
              <br />
              open right now.
            </h2>
            <p className="mt-6 max-w-sm text-neutral-400">
              Every jam here is a live Spotify session someone left the door open on. Tap one and you
              are in the same queue as everyone else in it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/feed"
                className="rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-neutral-200 active:scale-[0.98]"
              >
                See every jam
              </Link>
              <Link
                href="/trending"
                className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-neutral-100 transition hover:border-white/35 hover:bg-white/5 active:scale-[0.98]"
              >
                Trending
              </Link>
            </div>
          </div>
        </div>

        <div className="space-y-6 md:col-span-7 md:space-y-10">
          {loading ? (
            [0, 1, 2].map((i) => (
              <div key={i} aria-hidden className="jl-skeleton h-44 rounded-3xl md:h-56" />
            ))
          ) : jams.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-10 text-center">
              <p className="text-xl font-semibold">No jams are open right now.</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-400">
                JamLink only shows sessions that are genuinely live, so this space stays empty until
                someone opens one. That someone can be you.
              </p>
              <Link
                href="/new"
                className="mt-7 inline-flex rounded-full bg-[#1DB954] px-6 py-3 text-sm font-bold text-black transition hover:brightness-110 active:scale-[0.98]"
              >
                Post the first jam
              </Link>
            </div>
          ) : (
            jams.map((j) => (
              <Link
                key={j.id}
                href={`/jam/${j.id}`}
                data-rail-card
                className="group relative flex h-44 items-end overflow-hidden rounded-3xl border border-white/10 md:h-56"
              >
                <div
                  data-rail-art
                  aria-hidden
                  className="absolute inset-0 bg-cover bg-center opacity-70 grayscale contrast-125 mix-blend-luminosity transition-transform duration-700 ease-out group-hover:scale-105"
                  style={{ backgroundImage: `url(${picsum(j.genre + j.id.slice(0, 6), 1200, 800)})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent" />
                <div className="relative w-full p-6 md:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1DB954]">
                    {GENRE_LABEL[j.genre as keyof typeof GENRE_LABEL] ?? j.genre}
                  </p>
                  <h3 className="mt-2 truncate text-2xl font-bold tracking-tight md:text-3xl">
                    {j.title}
                  </h3>
                  <p className="mt-1 text-sm text-neutral-400">
                    {j.member_count} {j.member_count === 1 ? "listener" : "listeners"} inside,
                    opened {timeAgo(j.created_at)}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export function ScrubReveal({ text }: { text: string }) {
  const root = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(OK_MOTION, () => {
        const words = root.current?.querySelectorAll<HTMLElement>("[data-word]");
        if (!words?.length) return;
        gsap.set(words, { opacity: 0.1 });
        gsap.to(words, {
          opacity: 1,
          ease: "none",
          stagger: 0.4,
          scrollTrigger: { trigger: root.current, start: "top 80%", end: "bottom 55%", scrub: true },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <p
      ref={root}
      className="mx-auto max-w-5xl px-6 text-center text-[clamp(1.65rem,3.4vw,3.1rem)] font-medium leading-[1.22] tracking-tight"
    >
      {text.split(" ").map((w, i) => (
        // The space sits outside the inline-block so lines still wrap between words.
        <span key={i}>
          <span data-word className="inline-block">
            {w}
          </span>{" "}
        </span>
      ))}
    </p>
  );
}
