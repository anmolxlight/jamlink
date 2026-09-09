"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase, type Jam } from "@/lib/supabase";
import { GENRES, GENRE_LABEL, type Genre } from "@/lib/spotify";
import { JamCard, SkeletonGrid, NoEnvNotice, EmptyState } from "../components/jam-ui";
import { useToast } from "../components/toast";

// ponytail: 6 chips is enough of a nudge on the idle screen, the rest are one tap away in the filter row.
const POPULAR = GENRES.slice(0, 6);

export default function Search() {
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [genre, setGenre] = useState<Genre | "all">("all");
  const [results, setResults] = useState<Jam[]>([]);
  const [loading, setLoading] = useState(false);
  const [noEnv] = useState(() => !getSupabase());
  const toast = useToast();

  // Debounce keystrokes into a committed search term.
  useEffect(() => {
    const t = setTimeout(() => setTerm(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (!term) {
      setResults([]);
      setLoading(false);
      return;
    }
    const sb = getSupabase();
    if (!sb) return;
    setLoading(true);
    let alive = true;
    let query = sb.from("jams").select("*").eq("is_open", true).ilike("title", `%${term}%`);
    if (genre !== "all") query = query.eq("genre", genre);
    query
      .order("member_count", { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (!alive) return;
        setLoading(false);
        if (error) toast(error.message, "err");
        else setResults((data ?? []) as Jam[]);
      });
    return () => {
      alive = false;
    };
    // ponytail: toast is context-stable, term/genre drive the query
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term, genre]);

  // Typing again should show skeletons, not stale rows, before the debounce fires.
  const pending = loading || (q.trim() !== term && q.trim().length > 0);

  return (
    <div>
      <div className="mb-4">
        <label htmlFor="jl-search" className="mb-1 block text-sm font-medium text-neutral-200">
          Search open jams by title
        </label>
        <input
          id="jl-search"
          type="search"
          autoFocus
          autoComplete="off"
          placeholder="late night, boom bap, seoul..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-500 transition focus:border-[#1DB954]"
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Narrow by genre">
        {(["all", ...GENRES] as const).map((g) => {
          const active = genre === g;
          return (
            <button
              key={g}
              onClick={() => setGenre(g)}
              aria-pressed={active}
              className={`rounded-full px-3 py-1 text-sm transition active:scale-[0.98] ${
                active ? "bg-[#1DB954] font-semibold text-black" : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              {g === "all" ? "All" : GENRE_LABEL[g]}
            </button>
          );
        })}
      </div>

      {noEnv && <NoEnvNotice />}

      {!noEnv && !term && (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-8 text-center">
          <p className="font-semibold">Type to search open jams.</p>
          <p className="mt-1 text-sm text-neutral-400">Matches jam titles as you type. Or start from a genre:</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {POPULAR.map((g) => (
              <Link
                key={g}
                href={`/genre/${g}`}
                className="rounded-full bg-neutral-800 px-3 py-1.5 text-sm text-neutral-300 transition hover:bg-neutral-700 hover:text-neutral-100"
              >
                {GENRE_LABEL[g]}
              </Link>
            ))}
          </div>
          <Link
            href="/new"
            className="mt-5 inline-block rounded-full bg-[#1DB954] px-6 py-2.5 text-sm font-bold text-black transition hover:brightness-110 active:scale-[0.98]"
          >
            Post a jam
          </Link>
        </div>
      )}

      {!noEnv && term && pending && <SkeletonGrid count={4} label="Searching jams" />}

      {!noEnv && term && !pending && results.length === 0 && (
        <EmptyState
          title={`No open jams match "${term}".`}
          hint={genre === "all" ? "Try a shorter word, or post it yourself." : `Nothing in ${GENRE_LABEL[genre]}. Try All, or post it yourself.`}
          href="/new"
          cta="Post this jam"
        />
      )}

      {!noEnv && term && !pending && results.length > 0 && (
        <>
          <p className="mb-2 text-sm text-neutral-400" role="status">
            {results.length} {results.length === 1 ? "jam" : "jams"} matching &quot;{term}&quot;
          </p>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {results.map((j, i) => (
              <JamCard key={j.id} jam={j} index={i} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
