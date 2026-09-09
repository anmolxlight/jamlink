"use client";
// The one place the app asks "is anyone signed in?". Posting and joining both
// route through requireUser, so the redirect and the ?next= round trip are
// written once instead of copied per page. Path validation lives in safe-next.ts.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { loginHref, safeNext } from "@/lib/safe-next";

type Router = ReturnType<typeof useRouter>;

// Where the browser parks the return path while the magic link is in flight.
// The email opens a fresh page load, so component state cannot carry it.
const STASH = "jl:next";

export function stashNext(next: string) {
  try {
    localStorage.setItem(STASH, safeNext(next));
  } catch {
    // Storage denied still signs in, it just lands on the default route.
  }
}

// Query param wins, the stash is the fallback in case the param is dropped
// somewhere between the auth provider and the callback.
export function takeNext(fromUrl: string | null): string {
  let stashed: string | null = null;
  try {
    stashed = localStorage.getItem(STASH);
    localStorage.removeItem(STASH);
  } catch {
    stashed = null;
  }
  return safeNext(fromUrl ?? stashed);
}

export type Gate = { ok: true; user: User } | { ok: false; reason: "no-env" | "redirected" };

export async function requireUser(router: Router, next: string): Promise<Gate> {
  const sb = getSupabase();
  if (!sb) return { ok: false, reason: "no-env" };
  const { data } = await sb.auth.getUser();
  if (data.user) return { ok: true, user: data.user };
  stashNext(next);
  router.replace(loginHref(next));
  return { ok: false, reason: "redirected" };
}

// Page level form of the same check: a protected route mounts this instead of
// rendering its contents to a logged out visitor.
export function useAuthGate(next: string) {
  const router = useRouter();
  const [state, setState] = useState<"checking" | "no-env" | "ok">("checking");
  useEffect(() => {
    let alive = true;
    requireUser(router, next).then((r) => {
      if (!alive || (!r.ok && r.reason === "redirected")) return;
      setState(r.ok ? "ok" : "no-env");
    });
    return () => {
      alive = false;
    };
  }, [router, next]);
  return state;
}
