"use client";
import { useState } from "react";
import { getSupabase } from "@/lib/supabase";

type State = "idle" | "sending" | "sent" | "error";

export default function Login() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [detail, setDetail] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) {
      setState("error");
      setDetail("Supabase env not set.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setState("error");
      setDetail("Enter a valid email address.");
      return;
    }
    setState("sending");
    setDetail("");
    // ponytail: origin comes from the browser, so localhost stays localhost and
    // production stays production without a hardcoded URL anywhere.
    const { error } = await sb.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setState("error");
      setDetail(error.message);
    } else {
      setState("sent");
      setDetail(`Link sent to ${email.trim()}. Open it on this device to finish signing in.`);
    }
  }

  return (
    <form onSubmit={send} noValidate className="mx-auto w-full max-w-md space-y-5 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sign up or log in</h1>
        <p className="mt-2 text-sm text-neutral-400">
          One email link does both. If you are new it creates your account, and if you are already
          here it opens it. No password to remember.
        </p>
      </div>

      <div>
        <label htmlFor="jl-email" className="mb-1 block text-sm font-medium">
          Email
        </label>
        <input
          id="jl-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state === "error") setState("idle");
          }}
          aria-invalid={state === "error"}
          className={`w-full rounded-lg border bg-neutral-900 px-3 py-2.5 text-sm transition focus:border-[#1DB954] ${
            state === "error" ? "border-red-500" : "border-neutral-700"
          }`}
        />
      </div>

      <button
        disabled={state === "sending"}
        className="w-full rounded-full bg-[#1DB954] px-6 py-3 text-sm font-bold text-black transition hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
      >
        {state === "sending" ? "Sending..." : state === "sent" ? "Resend link" : "Email me a link"}
      </button>

      {state === "sent" && (
        <p role="status" className="rounded-lg border border-[#1DB954]/40 bg-neutral-900 p-3 text-sm text-neutral-200">
          {detail}
        </p>
      )}
      {state === "error" && (
        <p role="alert" className="text-sm text-red-400">
          {detail}
        </p>
      )}

      <p className="text-xs text-neutral-500">
        The link is single use and expires in an hour. Request another any time.
      </p>
    </form>
  );
}
