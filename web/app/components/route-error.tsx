"use client";
import Link from "next/link";

// Shared body for every route's error.tsx. ponytail: one component, five one-line boundaries.
export function RouteError({ what, reset }: { what: string; reset: () => void }) {
  return (
    <div className="rounded-lg border border-red-900 bg-neutral-900 p-8 text-center">
      <p className="font-semibold">Could not load {what}.</p>
      <p className="mt-1 text-sm text-neutral-400">Something went wrong on our side. Try again.</p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={reset}
          className="rounded-full bg-[#1DB954] px-6 py-2.5 text-sm font-bold text-black transition hover:brightness-110 active:scale-[0.98]"
        >
          Try again
        </button>
        <Link
          href="/feed"
          className="rounded-full border border-neutral-700 px-6 py-2.5 text-sm font-semibold text-neutral-200 transition hover:border-neutral-500 active:scale-[0.98]"
        >
          Back to feed
        </Link>
      </div>
    </div>
  );
}
