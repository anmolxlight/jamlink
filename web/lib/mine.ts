"use client";
// Loads the signed-in user plus the jams they host and joined.
// Shared by /my-jams and /profile. ponytail: one hook instead of the same
// two-step joined-jams query written twice.
import { useEffect, useState } from "react";
import { getSupabase, type Jam } from "@/lib/supabase";

export type MineState = "loading" | "no-env" | "signed-out" | "ready";

export function useMine() {
  const [state, setState] = useState<MineState>("loading");
  const [user, setUser] = useState<{ id: string; email: string }>({ id: "", email: "" });
  const [hosted, setHosted] = useState<Jam[]>([]);
  const [joined, setJoined] = useState<Jam[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setState("no-env");
      return;
    }
    let alive = true;
    (async () => {
      const {
        data: { user: u },
      } = await sb.auth.getUser();
      if (!alive) return;
      if (!u) {
        setState("signed-out");
        return;
      }
      setUser({ id: u.id, email: u.email ?? "" });

      const [host, memberships] = await Promise.all([
        sb.from("jams").select("*").eq("host_id", u.id).order("created_at", { ascending: false }),
        sb.from("jam_members").select("jam_id").eq("user_id", u.id),
      ]);
      if (!alive) return;
      if (host.data) setHosted(host.data as Jam[]);

      const ids = (memberships.data ?? []).map((r) => r.jam_id as string);
      if (ids.length) {
        const res = await sb.from("jams").select("*").in("id", ids).order("created_at", { ascending: false });
        if (!alive) return;
        if (res.data) setJoined(res.data as Jam[]);
        if (res.error) setError(res.error.message);
      }
      const failed = host.error ?? memberships.error;
      if (failed) setError(failed.message);
      setState("ready");
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { state, user, hosted, setHosted, joined, setJoined, error };
}
