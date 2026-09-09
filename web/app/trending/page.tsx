"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase, type Jam } from "@/lib/supabase";
import { timeAgo } from "@/lib/time";
import { Equalizer, EmptyState, NoEnvNotice } from "@/app/components/jam-ui";
import { useToast } from "@/app/components/toast";

function RankSkeleton({ i }: { i: number }) {
  return (
    <li
      aria-hidden
      style={{ "--i": i } as React.CSSProperties}
      className="jl-rank flex items-center gap-4 rounded-lg border border-neutral-800 bg-neutral-900 p-4"
    >
      <div className="jl-skeleton h-6 w-6 rounded" />
      <div className="min-w-0 flex-1">
        <div className="jl-skeleton h-5 w-2/3 rounded" />
        <div className="jl-skeleton mt-2 h-1.5 w-full rounded-full" />
      </div>
      <div className="jl-skeleton h-6 w-12 rounded" />
    </li>
  );
}

export default function Trending() {
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
    sb.from("jams")
      .select("*")
      .eq("is_open", true)
      .order("member_count", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        setLoading(false);
        if (error) toast(error.message, "err");
        else if (data) setJams(data as Jam[]);
      });
    // ponytail: toast stable via context, runs once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ponytail: first row is the max because the query is sorted by member_count desc
  const top = jams[0]?.member_count ?? 0;

  return (
    <div>
      <section className="mb-6">
        <div className="flex items-center gap-3">
          <Equalizer />
          <h1 className="text-3xl font-bold leading-tight md:text-4xl">Trending jams</h1>
        </div>
        <p className="mt-2 max-w-md text-sm text-neutral-400">
          The 50 busiest open jams right now, ranked by listeners in the room.
        </p>
      </section>

      {noEnv && <NoEnvNotice />}

      {loading && (
        <ul className="flex flex-col gap-2" aria-label="Loading trending jams">
          {Array.from({ length: 8 }).map((_, i) => (
            <RankSkeleton key={i} i={i} />
          ))}
        </ul>
      )}

      {!loading && !noEnv && jams.length === 0 && (
        <EmptyState title="Nothing is trending yet." hint="Be the jam everyone else ranks below." />
      )}

      {!loading && jams.length > 0 && (
        <ol className="flex flex-col gap-2">
          {jams.map((j, i) => {
            const rank = i + 1;
            const pct = top > 0 ? Math.max(4, Math.round((j.member_count / top) * 100)) : 4;
            return (
              <li
                key={j.id}
                style={{ "--i": Math.min(i, 12) } as React.CSSProperties}
                className="jl-rank flex items-center gap-4 rounded-lg border border-neutral-800 bg-neutral-900 p-4 transition hover:border-neutral-600"
              >
                <span
                  aria-hidden
                  className={`w-7 shrink-0 text-right text-lg font-bold tabular-nums ${
                    rank <= 3 ? "text-[#1DB954]" : "text-neutral-500"
                  }`}
                >
                  {rank}
                </span>
                <Equalizer className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/jam/${j.id}`}
                    className="block truncate font-semibold hover:text-[#1DB954]"
                  >
                    <span className="sr-only">Rank {rank}. </span>
                    {j.title}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-400">
                    <Link
                      href={`/genre/${j.genre}`}
                      className="rounded bg-neutral-800 px-2 py-0.5 text-xs transition hover:bg-neutral-700 hover:text-neutral-100"
                    >
                      {j.genre}
                    </Link>
                    <span aria-label={new Date(j.created_at).toLocaleString()}>{timeAgo(j.created_at)}</span>
                  </div>
                  <div aria-hidden className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
                    <div
                      className="h-full rounded-full bg-[#1DB954] transition-[width] duration-500 ease-out"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <span className="shrink-0 text-right">
                  <span className="block text-xl font-bold tabular-nums text-neutral-100">{j.member_count}</span>
                  <span className="block text-xs text-neutral-400">
                    {j.member_count === 1 ? "member" : "members"}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
