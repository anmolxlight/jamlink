"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabase, type Jam } from "@/lib/supabase";
import { GENRES, GENRE_BLURB, GENRE_LABEL, isGenre } from "@/lib/spotify";
import { Equalizer, EmptyState, JamCard, NoEnvNotice, SkeletonGrid } from "@/app/components/jam-ui";
import { useToast } from "@/app/components/toast";

export default function GenrePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [jams, setJams] = useState<Jam[]>([]);
  const [loading, setLoading] = useState(true);
  const [noEnv, setNoEnv] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setNoEnv(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    sb.from("jams")
      .select("*")
      .eq("genre", slug)
      .eq("is_open", true)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        setLoading(false);
        if (error) toast(error.message, "err");
        else setJams((data ?? []) as Jam[]);
      });
    // ponytail: toast stable via context, refetch only when the slug changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // ponytail: guard after the hooks so hook order stays stable. notFound() throws, so the
  // effect above never commits for an unknown slug.
  if (!isGenre(slug)) notFound();

  const label = GENRE_LABEL[slug];

  return (
    <div>
      <section className="mb-6 overflow-hidden rounded-xl border border-[#1DB954]/30 bg-gradient-to-b from-[#1DB954]/10 to-transparent p-6">
        <div className="flex items-center gap-3">
          <Equalizer />
          <span className="text-xs font-semibold uppercase tracking-widest text-[#1DB954]">Genre</span>
        </div>
        <h1 className="mt-2 text-3xl font-bold leading-tight md:text-5xl">{label}</h1>
        <p className="mt-2 max-w-md text-sm text-neutral-300">{GENRE_BLURB[slug]}</p>
        <p className="mt-3 text-sm text-neutral-300">
          <span className="font-bold tabular-nums text-[#1DB954]">{loading ? "..." : jams.length}</span>{" "}
          open {jams.length === 1 && !loading ? "jam" : "jams"} right now.
        </p>
        <Link
          href="/new"
          className="mt-4 inline-block rounded-full bg-[#1DB954] px-6 py-2.5 text-sm font-bold text-black transition hover:brightness-110 active:scale-[0.98]"
        >
          Post a jam in {label}
        </Link>
      </section>

      {noEnv && <NoEnvNotice />}

      {loading && <SkeletonGrid label={`Loading ${label} jams`} />}

      {!loading && !noEnv && jams.length === 0 && (
        <EmptyState title={`No open ${label} jams.`} hint="Start one and it lands at the top of this page." />
      )}

      {!loading && jams.length > 0 && (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {jams.map((j, i) => (
            <JamCard key={j.id} jam={j} index={i} />
          ))}
        </ul>
      )}

      <nav aria-label="Other genres" className="mt-10 border-t border-neutral-800 pt-6">
        <h2 className="text-sm font-semibold text-neutral-300">Browse other genres</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {GENRES.filter((g) => g !== slug).map((g) => (
            <li key={g}>
              <Link
                href={`/genre/${g}`}
                className="inline-block rounded-full bg-neutral-800 px-3 py-1 text-sm text-neutral-300 transition hover:bg-neutral-700 hover:text-neutral-100"
              >
                {GENRE_LABEL[g]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
