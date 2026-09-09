"use client";
// Landing spot for the magic link. Supabase sends the browser here with ?code=<pkce code>,
// which is exchanged for a session before we hand the user to the feed.
//
// This is a client route on purpose: only @supabase/supabase-js is installed (no
// @supabase/ssr), so the PKCE verifier lives in this browser's localStorage and a
// server route handler could not complete the exchange.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setError("Supabase is not connected in this environment.");
      return;
    }
    (async () => {
      const url = new URL(window.location.href);
      const denied = url.searchParams.get("error_description") ?? url.searchParams.get("error");
      if (denied) {
        setError(denied);
        return;
      }

      // getSession waits for the client to finish its own URL detection, so if the
      // built-in PKCE handler already consumed the code we do not race it here.
      const { data: existing } = await sb.auth.getSession();
      if (existing.session) {
        router.replace("/feed");
        return;
      }

      const code = url.searchParams.get("code");
      if (!code) {
        setError("This link is missing its sign in code. Request a fresh one.");
        return;
      }

      const { error: exchangeError } = await sb.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        setError(exchangeError.message);
        return;
      }
      router.replace("/feed");
    })();
  }, [router]);

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      {error ? (
        <>
          <h1 className="text-xl font-bold">That link did not work</h1>
          <p role="alert" className="mt-2 text-sm text-neutral-400">
            {error}
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-full bg-[#1DB954] px-6 py-2.5 text-sm font-bold text-black transition hover:brightness-110 active:scale-[0.98]"
          >
            Send a new link
          </Link>
        </>
      ) : (
        <p role="status" className="text-sm text-neutral-400">
          Signing you in...
        </p>
      )}
    </div>
  );
}
