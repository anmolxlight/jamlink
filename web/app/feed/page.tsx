"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase, type Jam } from "@/lib/supabase";
import { GENRES } from "@/lib/spotify";
import { useToast } from "../components/toast";
import { EmptyState, Equalizer, JamCard, NoEnvNotice, SkeletonGrid } from "../components/jam-ui";

export default function Feed() {
  const [jams, setJams] = useState<Jam[]>([]);
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const [genre, setGenre] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [noEnv, setNoEnv] = useState(false);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setNoEnv(true);
      setLoading(false);
      return;
    }
    sb.from("jams")
      .select("*")
      .eq("is_open", true)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        setLoading(false);
        if (error) toast(error.message, "err");
        else if (data) setJams(data as Jam[]);
      });
    const ch = sb
      .channel("jams-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "jams" }, (p) => {
        const j = p.new as Jam;
        if (!j.is_open) return;
        setJams((prev) => (prev.some((x) => x.id === j.id) ? prev : [j, ...prev]));
        setFreshIds((prev) => new Set(prev).add(j.id));
        setTimeout(() => setFreshIds((prev) => {
          const n = new Set(prev);
          n.delete(j.id);
          return n;
        }), 2000);
      })
      .subscribe();
    return () => {
      sb.removeChannel(ch);
    };
    // ponytail: toast stable via context, runs once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = new Map<string, number>();
  for (const j of jams) counts.set(j.genre, (counts.get(j.genre) ?? 0) + 1);
  const filtered = genre === "all" ? jams : jams.filter((j) => j.genre === genre);

  const randomJoin = () => {
    const pool = filtered.length ? filtered : jams;
    if (!pool.length) {
      toast("No open jams yet. Post the first one.", "err");
      return;
    }
    router.push(`/jam/${pool[Math.floor(Math.random() * pool.length)].id}`);
  };

  return (
    <div>
      <section className="mb-6">
        <div className="flex items-center gap-3">
          <Equalizer className="h-6" />
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            {jams.length} open now
          </span>
        </div>
        <h1 className="mt-2 max-w-xl text-3xl font-bold leading-tight md:text-4xl">
          Find a Spotify jam. Join in one tap.
        </h1>
        <p className="mt-2 max-w-md text-sm text-neutral-400">
          Browse open jams by genre or roll the dice.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            onClick={randomJoin}
            className="w-full rounded-full bg-[#1DB954] px-6 py-3 text-sm font-bold text-black transition hover:brightness-110 active:scale-[0.98] disabled:opacity-40 sm:w-auto"
          >
            Random jam
          </button>
          <Link
            href="/new"
            className="w-full rounded-full border border-neutral-700 px-6 py-3 text-center text-sm font-semibold text-neutral-200 transition hover:border-neutral-500 active:scale-[0.98] sm:w-auto"
          >
            Post your jam
          </Link>
          <Link
            href="/trending"
            className="w-full rounded-full border border-neutral-700 px-6 py-3 text-center text-sm font-semibold text-neutral-200 transition hover:border-neutral-500 active:scale-[0.98] sm:w-auto"
          >
            See trending
          </Link>
        </div>
      </section>

      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter by genre">
        {["all", ...GENRES].map((g) => {
          const n = g === "all" ? jams.length : (counts.get(g) ?? 0);
          const active = genre === g;
          return (
            <button
              key={g}
              onClick={() => setGenre(g)}
              aria-pressed={active}
              className={`rounded-full px-3 py-1 text-sm transition active:scale-[0.98] ${
                active
                  ? "bg-[#1DB954] font-semibold text-black"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              {g} <span className={active ? "text-black/70" : "text-neutral-500"}>{n}</span>
            </button>
          );
        })}
      </div>

      {noEnv && (
        <div className="space-y-3">
          <NoEnvNotice />
          <Link href="/new" className="inline-block font-semibold text-[#1DB954] hover:underline">
            Post a jam anyway
          </Link>
        </div>
      )}

      {loading && <SkeletonGrid />}

      {!loading && !noEnv && filtered.length === 0 && (
        <EmptyState
          title={`No open jams${genre !== "all" ? ` in ${genre}` : " yet"}.`}
          hint="Start the party yourself."
        />
      )}

      {!loading && filtered.length > 0 && (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filtered.map((j, i) => (
            <JamCard key={j.id} jam={j} index={i} fresh={freshIds.has(j.id)} />
          ))}
        </ul>
      )}
    </div>
  );
}
