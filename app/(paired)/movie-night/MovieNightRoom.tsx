"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { scheduleMovieNight, startMovieNightCountdown, endMovieNight, cancelMovieNight } from "./actions";
import { addTimelineEvent } from "../timeline/actions";

const SERVICES = ["Netflix", "Prime Video", "Disney+", "Other"] as const;
const SERVICE_LINKS: Record<string, string> = {
  Netflix: "https://www.netflix.com",
  "Prime Video": "https://www.primevideo.com",
  "Disney+": "https://www.disneyplus.com",
};
const REACTIONS = ["❤️", "😂", "😱", "🥹"];

type MovieNight = {
  id: string;
  title: string;
  service: string;
  scheduled_at: string;
  status: "scheduled" | "live" | "ended";
  started_at: string | null;
  created_by: string;
  url: string | null;
};

type Float = { id: number; emoji: string; from: string; x: number };

function fmtElapsed(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

export function MovieNightRoom({
  coupleId,
  displayName,
  partnerName,
  initial,
}: {
  coupleId: string;
  userId: string;
  displayName: string;
  partnerName: string;
  initial: MovieNight | null;
}) {
  const [movieNight, setMovieNight] = useState<MovieNight | null>(initial);
  const [floats, setFloats] = useState<Float[]>([]);
  const [pending, startTransition] = useTransition();
  const [, setTick] = useState(0);

  const [title, setTitle] = useState("");
  const [service, setService] = useState<(typeof SERVICES)[number]>("Netflix");
  const [scheduledAtLocal, setScheduledAtLocal] = useState("");
  const [url, setUrl] = useState("");
  const [scheduleError, setScheduleError] = useState(false);

  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const floatId = useRef(0);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`movie-${coupleId}`, { config: { broadcast: { self: true } } })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "movie_nights", filter: `couple_id=eq.${coupleId}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setMovieNight(null);
            return;
          }
          setMovieNight(payload.new as MovieNight);
        }
      )
      .on("broadcast", { event: "reaction" }, ({ payload }) => {
        const id = ++floatId.current;
        const x = 15 + Math.random() * 70;
        setFloats((f) => [...f, { id, emoji: payload.emoji, from: payload.from, x }]);
        setTimeout(() => setFloats((f) => f.filter((r) => r.id !== id)), 2200);
      })
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [coupleId]);

  useEffect(() => {
    if (!movieNight || movieNight.status !== "live") return;
    const interval = setInterval(() => setTick((t) => t + 1), 250);
    return () => clearInterval(interval);
  }, [movieNight]);

  const sendReaction = (emoji: string) => {
    channelRef.current?.send({ type: "broadcast", event: "reaction", payload: { emoji, from: displayName } });
  };

  const schedule = () => {
    if (!title.trim() || !scheduledAtLocal || pending) return;
    const iso = new Date(scheduledAtLocal).toISOString();
    const formData = new FormData();
    formData.set("title", title.trim());
    formData.set("service", service);
    formData.set("scheduledAtIso", iso);
    formData.set("url", url.trim());
    setScheduleError(false);
    startTransition(async () => {
      const result = await scheduleMovieNight(formData);
      if (result?.ok) {
        setTitle("");
        setScheduledAtLocal("");
        setUrl("");
      } else {
        setScheduleError(true);
      }
    });
  };

  const logToTimeline = () => {
    if (!movieNight || pending) return;
    const formData = new FormData();
    formData.set("title", movieNight.title);
    formData.set("note", `Watched together via ${movieNight.service} ✦`);
    formData.set("future", "false");
    startTransition(async () => {
      await addTimelineEvent(formData);
    });
  };

  if (!movieNight) {
    return (
      <section className="ss-card col-12">
        <div className="ss-kicker">Schedule a Movie Night</div>
        <label className="ss-field-label" htmlFor="mn-title">
          What are you watching?
        </label>
        <input
          id="mn-title"
          className="ss-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="The Grand Budapest Hotel"
        />
        <label className="ss-field-label">Where</label>
        <div className="ss-moods" style={{ marginBottom: 10 }}>
          {SERVICES.map((s) => (
            <button
              key={s}
              type="button"
              className={`ss-mood ${service === s ? "sel" : ""}`}
              onClick={() => setService(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <label className="ss-field-label" htmlFor="mn-when">
          When
        </label>
        <input
          id="mn-when"
          type="datetime-local"
          className="ss-input"
          value={scheduledAtLocal}
          onChange={(e) => setScheduledAtLocal(e.target.value)}
        />
        <label className="ss-field-label" htmlFor="mn-url">
          Link to the title (optional)
        </label>
        <input
          id="mn-url"
          type="url"
          className="ss-input"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.netflix.com/title/..."
        />
        <p className="ss-muted" style={{ marginTop: 4 }}>
          Paste the direct link to the title on {service} — &quot;Open&quot; will jump straight to it instead of the
          homepage.
        </p>
        {scheduleError && <p className="ss-error">Couldn&apos;t schedule that — please try again.</p>}
        <button
          className="ss-btn solid"
          type="button"
          disabled={!title.trim() || !scheduledAtLocal || pending}
          onClick={schedule}
          style={{ marginTop: 12 }}
        >
          {pending ? "Saving…" : "Schedule Movie Night ✦"}
        </button>
      </section>
    );
  }

  if (movieNight.status === "scheduled") {
    const when = new Date(movieNight.scheduled_at);
    const link = movieNight.url || SERVICE_LINKS[movieNight.service];
    return (
      <section className="ss-mn-card">
        <div className="ss-mn-kicker">Movie Night ✦ {displayName} &amp; {partnerName}</div>
        <h3 className="ss-mn-title">{movieNight.title}</h3>
        <p className="ss-mn-sub">On {movieNight.service}</p>
        <div className="ss-mn-when">
          🕗{" "}
          {when.toLocaleString("en-ZA", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
        {link && (
          <div className="ss-mn-openrow">
            <div className="ss-mn-opentext">
              <b>Step 1 — open it yourselves</b>
              <span>Each of you needs your own {movieNight.service} login. SoulSync just keeps you in sync.</span>
            </div>
            <a className="ss-mn-openbtn" href={link} target="_blank" rel="noopener noreferrer">
              Open {movieNight.service} ↗
            </a>
          </div>
        )}
        <button
          className="ss-mn-btn"
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => startMovieNightCountdown(movieNight.id))}
        >
          Step 2 — we&apos;re both ready, start the countdown
        </button>
        <button
          className="ss-mn-btn ghost"
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => cancelMovieNight(movieNight.id))}
        >
          Cancel
        </button>
      </section>
    );
  }

  if (movieNight.status === "live") {
    const startedAtMs = movieNight.started_at ? new Date(movieNight.started_at).getTime() : Date.now();
    const msUntilStart = startedAtMs - Date.now();

    if (msUntilStart > 0) {
      const count = Math.ceil(msUntilStart / 1000);
      return (
        <div className="ss-mn-countscreen">
          <div className="ss-mn-countnum">{count}</div>
          <div className="ss-mn-countlabel">Both of you, press play in…</div>
        </div>
      );
    }

    const elapsed = Math.floor((Date.now() - startedAtMs) / 1000);
    return (
      <div className="ss-mn-room">
        <div className="ss-mn-screen">
          Your {movieNight.service} app plays the film underneath — switch back to it any time. SoulSync floats on
          top for reactions.
        </div>

        <div className="ss-mn-topinfo">
          <div className="ss-mn-nowtitle">
            <span className="ss-mn-dot" />
            Watching together
          </div>
          <div className="ss-mn-timer">{fmtElapsed(elapsed)}</div>
        </div>

        <button
          className="ss-mn-endbtn"
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => endMovieNight(movieNight.id))}
        >
          End movie night
        </button>

        <div className="ss-mn-floats" aria-hidden="true">
          {floats.map((f) => (
            <div key={f.id} className="ss-mn-float" style={{ left: `${f.x}%` }}>
              {f.emoji}
              <span className="ss-mn-fromtag">{f.from}</span>
            </div>
          ))}
        </div>

        <div className="ss-mn-reactbar" role="group" aria-label="Send a reaction">
          {REACTIONS.map((e) => (
            <button key={e} className="ss-mn-react" type="button" onClick={() => sendReaction(e)}>
              {e}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="ss-mn-after">
      <b>How was movie night?</b>
      <p>
        {displayName} &amp; {partnerName} — watching the same story at the same second.
      </p>
      <button className="ss-btn solid" type="button" disabled={pending} onClick={logToTimeline}>
        {pending ? "Saving…" : "Add to timeline ✦"}
      </button>
      <button
        className="ss-btn"
        type="button"
        style={{ marginTop: 8 }}
        onClick={() => startTransition(() => cancelMovieNight(movieNight.id))}
      >
        Schedule another
      </button>
    </div>
  );
}
