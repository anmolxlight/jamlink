"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase, type Jam } from "@/lib/supabase";
import { parseJamId } from "@/lib/spotify";
import { requireUser } from "@/lib/gate";
import { timeAgo } from "@/lib/time";
import { useToast } from "../../components/toast";

type Member = { user_id: string; joined_at: string };

function spotifyDeepLink(url: string): string {
  const id = parseJamId(url);
  return id ? `spotify:jam:${id}` : url;
}

export default function JamDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [jam, setJam] = useState<Jam | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [joined, setJoined] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.from("jams").select("*").eq("id", id).single().then(({ data, error }) => {
      if (error || !data) setNotFound(true);
      else setJam(data as Jam);
    });
    sb.from("jam_members")
      .select("user_id,joined_at")
      .eq("jam_id", id)
      .order("joined_at", { ascending: true })
      .limit(50)
      .then(({ data }) => data && setMembers(data as Member[]));
  }, [id]);

  async function join() {
    setMsg("");
    // One gate for every protected action. Logged out lands on the login page
    // with this jam as the return path.
    const auth = await requireUser(router, `/jam/${id}`);
    if (!auth.ok) {
      if (auth.reason === "no-env") setMsg("Supabase env not set.");
      return;
    }
    const user = auth.user;
    setBusy(true);
    // ponytail: RPC not a raw insert, so is_open / max_members / duplicate checks are enforced server side
    const { error } = await getSupabase()!.rpc("join_jam", { p_jam_id: id });
    setBusy(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    setJoined(true);
    setJam((j) => (j ? { ...j, member_count: j.member_count + 1 } : j));
    setMembers((m) => [...m, { user_id: user.id, joined_at: new Date().toISOString() }]);
    toast("Joined. Opening Spotify...");
    window.open(jam?.spotify_url, "_blank");
  }

  if (notFound)
    return (
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-8 text-center">
        <p className="font-semibold">Jam not found.</p>
        <p className="mt-1 text-sm text-neutral-400">It may have been deleted.</p>
        <Link href="/feed" className="mt-4 inline-block font-semibold text-[#1DB954] hover:underline">
          Back to feed
        </Link>
      </div>
    );

  if (!jam)
    return (
      <p className="text-neutral-400">
        {getSupabase() ? "Loading jam..." : "Supabase env not set. Jam detail unavailable."}
      </p>
    );

  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold leading-tight md:text-3xl">{jam.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-neutral-400">
          <span className="rounded bg-neutral-800 px-2 py-0.5 text-xs">{jam.genre}</span>
          <span>
            {jam.member_count} {jam.member_count === 1 ? "member" : "members"}
          </span>
          <span>{timeAgo(jam.created_at)}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${jam.is_open ? "bg-[#1DB954]/15 text-[#1DB954]" : "bg-neutral-800 text-neutral-400"}`}
          >
            {jam.is_open ? "Open" : "Closed"}
          </span>
        </div>
      </div>

      {jam.description && <p className="text-neutral-300">{jam.description}</p>}

      {jam.is_open ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={join}
            disabled={busy || joined}
            className="w-full rounded-full bg-[#1DB954] px-8 py-3.5 text-base font-bold text-black transition hover:brightness-110 active:scale-[0.98] disabled:opacity-40 sm:w-auto sm:min-w-48"
          >
            {busy ? "Joining..." : joined ? "Joined" : "Join jam"}
          </button>
          <div className="flex w-full gap-2 sm:w-auto">
            <a
              href={jam.spotify_url}
              target="_blank"
              rel="noreferrer"
              className="flex-1 rounded-full border border-neutral-700 px-5 py-3.5 text-center text-sm font-semibold text-neutral-200 transition hover:border-neutral-500 active:scale-[0.98] sm:flex-none"
            >
              Open in Spotify
            </a>
            <a
              href={spotifyDeepLink(jam.spotify_url)}
              className="flex-1 rounded-full border border-neutral-700 px-5 py-3.5 text-center text-sm font-semibold text-neutral-200 transition hover:border-neutral-500 active:scale-[0.98] sm:flex-none"
            >
              Open app
            </a>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-sm">
          <p className="font-semibold">This jam is closed.</p>
          <p className="mt-1 text-neutral-400">The host ended this session. Find another open jam.</p>
          <Link
            href="/feed"
            className="mt-3 inline-block rounded-full bg-[#1DB954] px-6 py-2.5 text-sm font-bold text-black transition hover:brightness-110 active:scale-[0.98]"
          >
            Browse open jams
          </Link>
        </div>
      )}

      {msg && (
        <p role="status" className="text-sm text-neutral-300">
          {msg}
        </p>
      )}

      <section aria-label="Members">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Members ({members.length || jam.member_count})
        </h2>
        {members.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">Member list unavailable. Be the first to join.</p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {members.map((m) => (
              <li
                key={m.user_id}
                className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-xs font-bold">
                  {m.user_id.slice(0, 1).toUpperCase()}
                </span>
                <span className="truncate font-mono text-xs text-neutral-400">{m.user_id.slice(0, 8)}...</span>
                <span className="ml-auto shrink-0 text-xs text-neutral-500">{timeAgo(m.joined_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
