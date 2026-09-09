"use client";
// Post a jam. Split screen on desktop (sticky pitch + live preview left, form
// right), single column on mobile.
//
// Taste pre-flight:
// - Contrast: neutral-100 body on #0a0a0a, neutral-400 for support copy, black
//   on #1DB954 for the CTA. Nothing dimmer than neutral-500 carries meaning.
// - One intent per CTA: the only filled accent button on the page is Post jam.
// - No em-dashes, no meta labels. The preview looks like a feed card, not a
//   box labelled "preview".
// - Focus rings come from the global :focus-visible accent outline.
// - Reduced motion: no animation beyond the shared classes, which globals.css
//   already disables under prefers-reduced-motion.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { GENRES, GENRE_LABEL, parseJamId, validateSpotifyJam, type Genre } from "@/lib/spotify";
import { picsum } from "@/lib/img";
import { requireUser, useAuthGate } from "@/lib/gate";
import { Equalizer, NoEnvNotice } from "../components/jam-ui";
import { useToast } from "../components/toast";

const HERE = "/new";
const TITLE_MAX = 80;
const DESC_MAX = 280;

const FIELD =
  "w-full rounded-xl border bg-neutral-900 px-3.5 py-3 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-600";
const CALM = "border-white/10 hover:border-white/20 focus:border-[#1DB954]";
const ANGRY = "border-red-500/70 focus:border-red-400";
const COUNT = "text-xs tabular-nums text-neutral-500";

type Touched = { title: boolean; url: boolean };

export default function NewJam() {
  const gate = useAuthGate(HERE);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [genre, setGenre] = useState<Genre>("pop");
  const [desc, setDesc] = useState("");
  const [touched, setTouched] = useState<Touched>({ title: false, url: false });
  const [tried, setTried] = useState(false);
  const [state, setState] = useState<"idle" | "posting" | "done">("idle");
  const [formErr, setFormErr] = useState("");
  const router = useRouter();
  const toast = useToast();

  // Errors are derived, never stored. A field only shows one once it has been
  // left or the form has been submitted, so a pristine page is never red.
  const titleErr = title.trim() ? "" : "Give it a title so people know what is playing.";
  const check = validateSpotifyJam(url, title);
  const urlErr = url.trim() ? (check.ok ? "" : check.error!) : "Paste the jam link you copied from Spotify.";
  const linkReady = url.trim().length > 0 && check.ok;
  const showTitleErr = (touched.title || tried) && titleErr;
  const showUrlErr = (touched.url || tried) && urlErr;

  async function paste() {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        toast("Clipboard is empty.", "err");
        return;
      }
      setUrl(text.trim());
      setTouched((t) => ({ ...t, url: true }));
    } catch {
      toast("Clipboard is blocked. Paste the link by hand.", "err");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTried(true);
    setFormErr("");
    if (titleErr || urlErr) return;

    // Same helper the Join button uses. A session can expire while the form is
    // open, so the gate runs again at submit time.
    const auth = await requireUser(router, HERE);
    if (!auth.ok) {
      if (auth.reason === "no-env") setFormErr("Supabase is not connected in this environment.");
      return;
    }

    setState("posting");
    const { data, error } = await getSupabase()!
      .from("jams")
      .insert({
        host_id: auth.user.id,
        title: title.trim(),
        spotify_url: url.trim(),
        genre,
        description: desc.trim(),
      })
      .select("id")
      .single();

    if (error) {
      setState("idle");
      setFormErr(error.message);
      return;
    }
    setState("done");
    toast("Jam posted. Sending you to it.");
    router.push(`/jam/${(data as { id: string }).id}`);
  }

  if (gate === "no-env") return <NoEnvNotice />;
  if (gate === "checking")
    return (
      <div className="mx-auto w-full max-w-md py-20 text-center">
        <p role="status" className="text-sm text-neutral-400">
          Checking your session...
        </p>
      </div>
    );

  const seed = parseJamId(url) || title.trim() || genre;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-16">
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <h1 className="text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl">
          Open the room.
          <br />
          Let people walk in.
        </h1>
        <p className="mt-4 text-sm text-neutral-400">
          Your jam lands in the feed the moment you post it.
        </p>

        <figure className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-neutral-900">
          <div
            className="relative h-40 bg-neutral-800 bg-cover bg-center"
            style={{ backgroundImage: `url(${picsum(seed, 800, 450)})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            <div className="absolute inset-x-4 bottom-3 flex items-center gap-2">
              <Equalizer className="shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#1DB954]">Open now</span>
            </div>
          </div>
          <figcaption className="p-4">
            <p className={`truncate text-lg font-semibold ${title.trim() ? "text-neutral-100" : "text-neutral-600"}`}>
              {title.trim() || "Your jam title"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-400">
              <span className="rounded bg-white/10 px-2 py-0.5 text-neutral-200">{GENRE_LABEL[genre]}</span>
              <span>1 member</span>
              <span>just now</span>
            </div>
            <p className={`mt-2 line-clamp-2 text-sm ${desc.trim() ? "text-neutral-300" : "text-neutral-600"}`}>
              {desc.trim() || "Say what is playing and who it is for."}
            </p>
            {linkReady ? (
              <a
                href={url.trim()}
                target="_blank"
                rel="noreferrer"
                className="mt-4 block rounded-full border border-white/20 py-2.5 text-center text-sm font-semibold text-neutral-100 transition hover:border-white/40"
              >
                Open in Spotify
              </a>
            ) : (
              <p className="mt-4 rounded-full border border-white/5 py-2.5 text-center text-sm font-semibold text-neutral-600">
                Open in Spotify
              </p>
            )}
          </figcaption>
        </figure>
      </aside>

      <form onSubmit={submit} noValidate className="w-full max-w-xl space-y-7">
        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <label htmlFor="jl-title" className="text-sm font-semibold">
              Title
            </label>
            <span className={COUNT}>
              {title.length}/{TITLE_MAX}
            </span>
          </div>
          <input
            id="jl-title"
            value={title}
            maxLength={TITLE_MAX}
            placeholder="Late night lofi session"
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, title: true }))}
            aria-invalid={!!showTitleErr}
            aria-describedby={showTitleErr ? "jl-title-err" : undefined}
            className={`${FIELD} ${showTitleErr ? ANGRY : CALM}`}
          />
          {showTitleErr && (
            <p id="jl-title-err" role="alert" className="mt-1.5 text-sm text-red-400">
              {titleErr}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="jl-url" className="mb-1.5 block text-sm font-semibold">
            Spotify jam link
          </label>
          <div className="flex gap-2">
            <input
              id="jl-url"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              value={url}
              placeholder="https://open.spotify.com/jam/..."
              onChange={(e) => setUrl(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, url: true }))}
              aria-invalid={!!showUrlErr}
              aria-describedby={showUrlErr ? "jl-url-err" : undefined}
              className={`${FIELD} ${showUrlErr ? ANGRY : CALM}`}
            />
            <button
              type="button"
              onClick={paste}
              className="shrink-0 rounded-xl border border-white/10 px-4 text-sm font-semibold text-neutral-200 transition hover:border-white/30 hover:text-white"
            >
              Paste
            </button>
          </div>
          {showUrlErr ? (
            <p id="jl-url-err" role="alert" className="mt-1.5 text-sm text-red-400">
              {urlErr}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-neutral-500">
              In Spotify tap Share on the jam, then Copy link.
            </p>
          )}
        </div>

        <div>
          <span id="jl-genre-label" className="mb-2.5 block text-sm font-semibold">
            Genre
          </span>
          {/* ponytail: buttons with radio semantics, no dropdown. All 13 stay
              tab reachable, which beats a roving tabindex nobody asked for. */}
          <div role="radiogroup" aria-labelledby="jl-genre-label" className="flex flex-wrap gap-2">
            {GENRES.map((g) => {
              const on = g === genre;
              return (
                <button
                  key={g}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setGenre(g)}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    on
                      ? "bg-[#1DB954] font-bold text-black"
                      : "border border-white/10 text-neutral-300 hover:border-white/30 hover:text-white"
                  }`}
                >
                  {GENRE_LABEL[g]}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <label htmlFor="jl-desc" className="text-sm font-semibold">
              Description
            </label>
            <span className={COUNT}>
              {desc.length}/{DESC_MAX}
            </span>
          </div>
          <textarea
            id="jl-desc"
            rows={3}
            maxLength={DESC_MAX}
            value={desc}
            placeholder="What are we listening to?"
            onChange={(e) => setDesc(e.target.value)}
            className={`${FIELD} ${CALM} resize-y`}
          />
        </div>

        {formErr && (
          <p role="alert" className="rounded-xl border border-red-500/40 bg-red-950/40 px-3.5 py-3 text-sm text-red-300">
            {formErr}
          </p>
        )}

        <button
          disabled={state !== "idle"}
          className="w-full rounded-full bg-[#1DB954] px-6 py-3.5 text-base font-bold text-black transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        >
          {state === "posting" ? "Posting..." : state === "done" ? "Posted" : "Post jam"}
        </button>
      </form>
    </div>
  );
}
