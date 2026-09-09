import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md p-8 text-center">
      <p className="text-5xl font-bold text-[#1DB954]">404</p>
      <h1 className="mt-2 text-xl font-bold">Page not found</h1>
      <p className="mt-1 text-sm text-neutral-400">This track stopped playing. Head back to the feed.</p>
      <Link
        href="/feed"
        className="mt-5 inline-block rounded-full bg-[#1DB954] px-6 py-2.5 text-sm font-bold text-black transition hover:brightness-110 active:scale-[0.98]"
      >
        Back to feed
      </Link>
    </div>
  );
}
