// Shared jam UI primitives. Used by every route so cards, skeletons, empty
// states and error boundaries stay identical across the app.
// ponytail: no "use client" needed, these are pure render and usable from loading.tsx too.
import Link from "next/link";
import type { Jam } from "@/lib/supabase";
import { timeAgo } from "@/lib/time";

export function Equalizer({ idle = false, className = "" }: { idle?: boolean; className?: string }) {
  return (
    <span className={`jl-eq ${className}`} data-idle={idle} aria-hidden>
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}

export function JamCard({ jam, index = 0, fresh = false }: { jam: Jam; index?: number; fresh?: boolean }) {
  return (
    <li
      style={{ "--i": Math.min(index, 12) } as React.CSSProperties}
      className={`jl-enter rounded-lg border border-neutral-800 bg-neutral-900 p-4 transition hover:border-neutral-600 ${
        fresh ? "jl-insert border-[#1DB954]/50" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <Equalizer idle={!jam.is_open} className="mt-1.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <Link href={`/jam/${jam.id}`} className="block truncate text-lg font-semibold hover:text-[#1DB954]">
            {jam.title}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-400">
            <Link
              href={`/genre/${jam.genre}`}
              className="rounded bg-neutral-800 px-2 py-0.5 text-xs transition hover:bg-neutral-700 hover:text-neutral-100"
            >
              {jam.genre}
            </Link>
            <span>
              {jam.member_count} {jam.member_count === 1 ? "member" : "members"}
            </span>
            <span aria-label={new Date(jam.created_at).toLocaleString()}>{timeAgo(jam.created_at)}</span>
            {!jam.is_open && <span className="rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">closed</span>}
          </div>
          {jam.description && <p className="mt-2 line-clamp-2 text-sm text-neutral-300">{jam.description}</p>}
        </div>
      </div>
    </li>
  );
}

export function CardSkeleton() {
  return (
    <li aria-hidden className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <div className="jl-skeleton h-6 w-3/4 rounded" />
      <div className="mt-2 flex gap-2">
        <div className="jl-skeleton h-5 w-14 rounded" />
        <div className="jl-skeleton h-5 w-16 rounded" />
      </div>
    </li>
  );
}

export function SkeletonGrid({ count = 6, label = "Loading jams" }: { count?: number; label?: string }) {
  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2" aria-label={label}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </ul>
  );
}

export function EmptyState({
  title,
  hint,
  href = "/new",
  cta = "Post the first jam",
}: {
  title: string;
  hint?: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-8 text-center">
      <p className="font-semibold">{title}</p>
      {hint && <p className="mt-1 text-sm text-neutral-400">{hint}</p>}
      <Link
        href={href}
        className="mt-4 inline-block rounded-full bg-[#1DB954] px-6 py-2.5 text-sm font-bold text-black transition hover:brightness-110 active:scale-[0.98]"
      >
        {cta}
      </Link>
    </div>
  );
}

export function NoEnvNotice() {
  return (
    <div className="rounded-lg border border-yellow-800 bg-yellow-950 p-4 text-sm text-yellow-200">
      Supabase is not connected. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to see live jams.
    </div>
  );
}

// Page skeleton shell used by every loading.tsx: title bar + card grid.
export function PageLoading({ cards = 6 }: { cards?: number }) {
  return (
    <div>
      <div className="jl-skeleton mb-2 h-8 w-48 rounded" />
      <div className="jl-skeleton mb-6 h-4 w-72 rounded" />
      <SkeletonGrid count={cards} />
    </div>
  );
}
