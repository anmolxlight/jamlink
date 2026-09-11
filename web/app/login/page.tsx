"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { stashNext } from "@/lib/gate";
import { safeNext } from "@/lib/safe-next";

type State = "idle" | "sending" | "sent" | "error";
type Mode = "link" | "password";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("link");
  const [working, setWorking] = useState(false);
  const [state, setState] = useState<State>("idle");
  const [detail, setDetail] = useState("");
  const [next, setNext] = useState("/feed");

  // ponytail: read on mount instead of useSearchParams, which would drag a
  // Suspense boundary into a page that has nothing to suspend on.
  useEffect(() => {
    setNext(safeNext(new URLSearchParams(window.location.search).get("next")));
  }, []);

  const reason = next.startsWith("/new")
    ? "Log in to post your jam."
    : next.startsWith("/jam/")
      ? "Log in to join this jam."
      : "";

  const emailOk = /^\S+@\S+\.\S+$/.test(email.trim());

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) {
      setState("error");
      setDetail("Supabase env not set.");
      return;
    }
    if (!emailOk) {
      setState("error");
      setDetail("Enter a valid email address.");
      return;
    }
    setState("sending");
    setDetail("");
    // ponytail: origin comes from the browser, so localhost stays localhost and
    // production stays production without a hardcoded URL anywhere.
    // The return path rides along in the query and in localStorage, since the
    // magic link comes back as a fresh page load with no component state.
    stashNext(next);
    const { error } = await sb.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setState("error");
      setDetail(error.message);
    } else {
      setState("sent");
      setDetail(`Link sent to ${email.trim()}. Open it on this device to finish signing in.`);
    }
  }

  async function passwordAuth(kind: "signin" | "signup") {
    const sb = getSupabase();
    if (!sb) {
      setState("error");
      setDetail("Supabase env not set.");
      return;
    }
    if (!emailOk) {
      setState("error");
      setDetail("Enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setState("error");
      setDetail("Password needs at least 6 characters.");
      return;
    }
    setWorking(true);
    setDetail("");
    const { data, error } =
      kind === "signin"
        ? await sb.auth.signInWithPassword({ email: email.trim(), password })
        : await sb.auth.signUp({ email: email.trim(), password });
    setWorking(false);
    if (error) {
      setState("error");
      setDetail(error.message);
      return;
    }
    if (data.session) router.replace(next);
    else {
      setState("sent");
      setDetail(
        `Account created for ${email.trim()}. Check your inbox to confirm it, then come back and sign in.`,
      );
    }
  }

  const tab = (m: Mode, label: string) => (
    <button
      key={m}
      type="button"
      role="tab"
      aria-selected={mode === m}
      onClick={() => {
        setMode(m);
        setState("idle");
        setDetail("");
      }}
      className={`flex-1 rounded-full px-4 py-2 text-sm font-bold transition ${
        mode === m ? "bg-[#1DB954] text-black" : "border border-neutral-700 text-neutral-300"
      }`}
    >
      {label}
    </button>
  );

  return (
    <form onSubmit={send} noValidate className="mx-auto w-full max-w-md space-y-5 py-8">
      <div>
        {reason && <p className="mb-2 text-sm font-semibold text-[#1DB954]">{reason}</p>}
        <h1 className="text-3xl font-bold tracking-tight">Sign up or log in</h1>
        <p className="mt-2 text-sm text-neutral-400">
          {mode === "link"
            ? "One email link does both. If you are new it creates your account, and if you are already here it opens it. No password to remember."
            : "Use your email and password. New here? Create your account below."}
        </p>
      </div>

      <div className="flex gap-2" role="tablist" aria-label="Sign in method">
        {tab("link", "Email link")}
        {tab("password", "Password")}
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

      {mode === "password" ? (
        <div>
          <label htmlFor="jl-password" className="mb-1 block text-sm font-medium">
            Password
          </label>
          <input
            id="jl-password"
            type="password"
            autoComplete={password ? "current-password" : "off"}
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-sm transition focus:border-[#1DB954]"
          />
        </div>
      ) : null}

      {mode === "link" ? (
        <button
          disabled={state === "sending"}
          className="w-full rounded-full bg-[#1DB954] px-6 py-3 text-sm font-bold text-black transition hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
        >
          {state === "sending" ? "Sending..." : state === "sent" ? "Resend link" : "Email me a link"}
        </button>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            disabled={working}
            onClick={() => passwordAuth("signin")}
            className="w-full rounded-full bg-[#1DB954] px-6 py-3 text-sm font-bold text-black transition hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
          >
            {working ? "Signing in..." : "Sign in"}
          </button>
          <button
            type="button"
            disabled={working}
            onClick={() => passwordAuth("signup")}
            className="w-full rounded-full border border-neutral-700 px-6 py-3 text-sm font-bold text-neutral-200 transition hover:border-[#1DB954] disabled:opacity-40"
          >
            Create account
          </button>
        </div>
      )}

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
        {mode === "link"
          ? "The link is single use and expires in an hour. Request another any time."
          : "Passwords are stored as salted hashes and never touch our code."}
      </p>
    </form>
  );
}
