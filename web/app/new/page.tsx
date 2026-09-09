"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { GENRES, validateSpotifyJam } from "@/lib/spotify";
import { useToast } from "../components/toast";

const input =
  "w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm transition focus:border-[#1DB954]";

export default function NewJam() {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [genre, setGenre] = useState<string>("pop");
  const [desc, setDesc] = useState("");
  const [titleErr, setTitleErr] = useState("");
  const [urlErr, setUrlErr] = useState("");
  const [formErr, setFormErr] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const toast = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTitleErr("");
    setUrlErr("");
    setFormErr("");
    let bad = false;
    if (!title.trim()) {
      setTitleErr("Title is required.");
      bad = true;
    }
    const v = validateSpotifyJam(url, title);
    if (!v.ok) {
      setUrlErr(v.error!);
      bad = true;
    }
    if (bad) return;
    const sb = getSupabase();
    if (!sb) {
      setFormErr("Supabase env not set.");
      return;
    }
    setBusy(true);
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    const { data, error } = await sb
      .from("jams")
      .insert({ host_id: user.id, title: title.trim(), spotify_url: url.trim(), genre, description: desc.trim() })
      .select("id")
      .single();
    setBusy(false);
    if (error) {
      setFormErr(error.message);
      return;
    }
    toast("Jam posted.");
    router.push(`/jam/${(data as { id: string }).id}`);
  }

  return (
    <form onSubmit={submit} noValidate className="mx-auto w-full max-w-lg space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Post a jam</h1>
        <p className="mt-1 text-sm text-neutral-400">Share your Spotify jam link with a genre.</p>
      </div>
      <div>
        <label htmlFor="jl-title" className="mb-1 block text-sm font-medium">
          Title
        </label>
        <input
          id="jl-title"
          className={`${input} ${titleErr ? "border-red-500" : ""}`}
          placeholder="Late night lofi session"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={!!titleErr}
          aria-describedby={titleErr ? "jl-title-err" : undefined}
        />
        {titleErr && (
          <p id="jl-title-err" role="alert" className="mt-1 text-sm text-red-400">
            {titleErr}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="jl-url" className="mb-1 block text-sm font-medium">
          Spotify jam link
        </label>
        <input
          id="jl-url"
          inputMode="url"
          className={`${input} ${urlErr ? "border-red-500" : ""}`}
          placeholder="https://open.spotify.com/jam/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          aria-invalid={!!urlErr}
          aria-describedby={urlErr ? "jl-url-err" : undefined}
        />
        {urlErr && (
          <p id="jl-url-err" role="alert" className="mt-1 text-sm text-red-400">
            {urlErr}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="jl-genre" className="mb-1 block text-sm font-medium">
          Genre
        </label>
        <select id="jl-genre" className={input} value={genre} onChange={(e) => setGenre(e.target.value)}>
          {GENRES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="jl-desc" className="mb-1 block text-sm font-medium">
          Description <span className="font-normal text-neutral-500">(optional)</span>
        </label>
        <textarea
          id="jl-desc"
          className={input}
          placeholder="What are we listening to?"
          rows={3}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          maxLength={500}
        />
      </div>
      {formErr && (
        <p role="alert" className="text-sm text-red-400">
          {formErr}
        </p>
      )}
      <button
        disabled={busy}
        className="w-full rounded bg-[#1DB954] px-4 py-2.5 font-bold text-black transition hover:brightness-110 active:scale-[0.98] disabled:opacity-40 sm:w-auto"
      >
        {busy ? "Posting..." : "Post jam"}
      </button>
    </form>
  );
}
