"use client";
import { useState } from "react";
import { JamCard, SkeletonGrid, NoEnvNotice, EmptyState } from "../components/jam-ui";
import { useMine } from "@/lib/mine";
import type { Jam } from "@/lib/supabase";

function Section({ title, jams, empty }: { title: string; jams: Jam[]; empty: string }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">
        {title} <span className="text-neutral-500">({jams.length})</span>
      </h2>
      {jams.length === 0 ? (
        <EmptyState title={empty} hint="Open jams show up here the moment you post or join one." cta="Post a jam" />
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {jams.map((j, i) => (
            <JamCard key={j.id} jam={j} index={i} />
          ))}
        </ul>
      )}
    </section>
  );
}

export default function MyJams() {
  const { state, hosted, joined, error } = useMine();
  const [openOnly, setOpenOnly] = useState(false);

  if (state === "no-env") return <NoEnvNotice />;
  if (state === "loading") return <SkeletonGrid count={4} label="Loading your jams" />;
  if (state === "signed-out")
    return (
      <EmptyState
        title="Sign in to see your jams."
        hint="JamLink uses a passwordless magic link."
        href="/login"
        cta="Go to login"
      />
    );

  const show = (list: Jam[]) => (openOnly ? list.filter((j) => j.is_open) : list);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">My jams</h1>
        <div className="ml-auto flex gap-1" role="group" aria-label="Filter by status">
          {([
            ["all", "All"],
            ["open", "Open only"],
          ] as const).map(([key, label]) => {
            const active = (key === "open") === openOnly;
            return (
              <button
                key={key}
                onClick={() => setOpenOnly(key === "open")}
                aria-pressed={active}
                className={`rounded-full px-3 py-1 text-sm transition active:scale-[0.98] ${
                  active ? "bg-[#1DB954] font-semibold text-black" : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-900 bg-neutral-900 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <Section title="Hosting" jams={show(hosted)} empty="You are not hosting any jams." />
      <Section title="Joined" jams={show(joined)} empty="You have not joined any jams." />
    </div>
  );
}
