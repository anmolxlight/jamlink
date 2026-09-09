"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase, type Jam } from "@/lib/supabase";
import { timeAgo } from "@/lib/time";
import { SkeletonGrid, NoEnvNotice, EmptyState } from "../components/jam-ui";
import { useToast } from "../components/toast";
import { useMine } from "@/lib/mine";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <div className="text-2xl font-bold text-[#1DB954]">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-neutral-500">{label}</div>
    </div>
  );
}

function Row({ jam, children }: { jam: Jam; children: React.ReactNode }) {
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3">
      <div className="min-w-0 flex-1">
        <Link href={`/jam/${jam.id}`} className="block truncate font-semibold text-neutral-100 hover:text-[#1DB954]">
          {jam.title}
        </Link>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
          <span>{jam.genre}</span>
          <span>
            {jam.member_count} {jam.member_count === 1 ? "member" : "members"}
          </span>
          <span>{timeAgo(jam.created_at)}</span>
          {!jam.is_open && <span className="rounded bg-neutral-800 px-2 py-0.5 text-neutral-400">closed</span>}
        </div>
      </div>
      {children}
    </li>
  );
}

const BTN =
  "shrink-0 rounded-full border border-neutral-700 px-4 py-1.5 text-sm font-semibold text-neutral-200 transition hover:border-neutral-500 active:scale-[0.98] disabled:opacity-40";

export default function Profile() {
  const { state, user, hosted, setHosted, joined, setJoined, error } = useMine();
  const [busy, setBusy] = useState("");
  const toast = useToast();
  const router = useRouter();

  if (state === "no-env") return <NoEnvNotice />;
  if (state === "loading") return <SkeletonGrid count={4} label="Loading your profile" />;
  if (state === "signed-out")
    return (
      <EmptyState
        title="Sign in to see your profile."
        hint="JamLink uses a passwordless magic link."
        href="/login"
        cta="Go to login"
      />
    );

  // Optimistic flip: the row reads as done immediately, reverts if the RPC rejects.
  async function toggleOpen(jam: Jam) {
    const closing = jam.is_open;
    if (closing && !window.confirm(`Close "${jam.title}"? Nobody else will be able to join.`)) return;
    const sb = getSupabase();
    if (!sb) return;
    const key = `open:${jam.id}`;
    setBusy(key);
    const flip = (open: boolean) => setHosted((prev) => prev.map((x) => (x.id === jam.id ? { ...x, is_open: open } : x)));
    flip(!closing);
    const { error: rpcError } = await sb.rpc(closing ? "close_jam" : "reopen_jam", { p_jam_id: jam.id });
    setBusy("");
    if (rpcError) {
      flip(closing);
      toast(rpcError.message, "err");
      return;
    }
    toast(closing ? "Jam closed." : "Jam reopened.");
  }

  async function leave(jam: Jam) {
    if (!window.confirm(`Leave "${jam.title}"?`)) return;
    const sb = getSupabase();
    if (!sb) return;
    setBusy(`leave:${jam.id}`);
    const { error: rpcError } = await sb.rpc("leave_jam", { p_jam_id: jam.id });
    setBusy("");
    if (rpcError) {
      toast(rpcError.message, "err");
      return;
    }
    setJoined((prev) => prev.filter((x) => x.id !== jam.id));
    toast("Left the jam.");
  }

  async function signOut() {
    const sb = getSupabase();
    if (!sb) return;
    setBusy("signout");
    const { error: outError } = await sb.auth.signOut();
    setBusy("");
    if (outError) {
      toast(outError.message, "err");
      return;
    }
    router.push("/");
  }

  const openCount = hosted.filter((j) => j.is_open).length;
  const totalMembers = hosted.reduce((n, j) => n + j.member_count, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold">{user.email || "Your profile"}</h1>
          <p className="mt-0.5 font-mono text-xs text-neutral-500">{user.id.slice(0, 8)}...</p>
        </div>
        <button onClick={signOut} disabled={busy === "signout"} className={`${BTN} ml-auto`}>
          {busy === "signout" ? "Signing out..." : "Sign out"}
        </button>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-900 bg-neutral-900 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Hosted" value={hosted.length} />
        <Stat label="Joined" value={joined.length} />
        <Stat label="Members hosted" value={totalMembers} />
        <Stat label="Open / closed" value={`${openCount} / ${hosted.length - openCount}`} />
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">Jams you host</h2>
        {hosted.length === 0 ? (
          <EmptyState title="You are not hosting any jams." hint="Post one and it shows up here." cta="Post a jam" />
        ) : (
          <ul className="space-y-2">
            {hosted.map((j) => (
              <Row key={j.id} jam={j}>
                <button onClick={() => toggleOpen(j)} disabled={busy === `open:${j.id}`} className={BTN}>
                  {busy === `open:${j.id}` ? "Saving..." : j.is_open ? "Close" : "Reopen"}
                </button>
              </Row>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">Jams you joined</h2>
        {joined.length === 0 ? (
          <EmptyState title="You have not joined any jams." hint="Browse the feed and jump into one." href="/feed" cta="Browse jams" />
        ) : (
          <ul className="space-y-2">
            {joined.map((j) => (
              <Row key={j.id} jam={j}>
                <button onClick={() => leave(j)} disabled={busy === `leave:${j.id}`} className={BTN}>
                  {busy === `leave:${j.id}` ? "Leaving..." : "Leave"}
                </button>
              </Row>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
