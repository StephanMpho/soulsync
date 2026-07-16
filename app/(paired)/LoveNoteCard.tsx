"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { sendLoveNote, sendPing, openLoveNote, sendVoiceNote } from "./actions";

const QUICK = ["Thinking of you", "Miss you", "So proud of you", "Can't wait to see you"];
const MAX_SECONDS = 20;

// Decorative — not derived from real amplitude data. A 20-second clip
// doesn't justify decoding audio just to draw a waveform; the mockup's own
// bars are the same fixed pseudo-random shape.
const WAVE_BARS = Array.from({ length: 28 }, (_, i) =>
  8 + Math.round(14 * Math.abs(Math.sin(i * 0.7)) + 6 * Math.abs(Math.sin(i * 1.9)))
);

function fmt(seconds: number) {
  return `0:${String(seconds).padStart(2, "0")}`;
}

function pickMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function VoicePlayer({ src, duration }: { src: string; duration: number | null }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) el.pause();
    else el.play();
  };

  return (
    <div className="ss-voice-player">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audioRef}
        src={src}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
        }}
        onTimeUpdate={(e) => {
          const el = e.currentTarget;
          if (el.duration) setProgress((el.currentTime / el.duration) * 100);
        }}
      />
      <button type="button" className="ss-voice-play" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
        {playing ? "❚❚" : "▶"}
      </button>
      <div className="ss-voice-wave" aria-hidden="true">
        {WAVE_BARS.map((h, i) => (
          <i key={i} className={(i / WAVE_BARS.length) * 100 < progress ? "played" : ""} style={{ height: h }} />
        ))}
      </div>
      <span className="ss-voice-dur">{duration ? fmt(duration) : ""}</span>
    </div>
  );
}

function VoiceRecorder({ onSent }: { onSent: () => void }) {
  const [supported, setSupported] = useState(true);
  const [stage, setStage] = useState<"idle" | "recording" | "preview">("idle");
  const [seconds, setSeconds] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSupported(
      typeof navigator !== "undefined" && Boolean(navigator.mediaDevices) && typeof MediaRecorder !== "undefined"
    );
  }, []);

  useEffect(() => {
    if (stage !== "recording") return;
    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s + 1 >= MAX_SECONDS) recorderRef.current?.stop();
        return s + 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stage]);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMimeType();
      mimeTypeRef.current = mimeType;
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current || "audio/webm" });
        setPreviewUrl(URL.createObjectURL(blob));
        setStage("preview");
      };
      recorderRef.current = recorder;
      recorder.start();
      setSeconds(0);
      setStage("recording");
    } catch {
      setError("Couldn't access your microphone — check the browser's permission for this site.");
    }
  };

  const stopRecording = () => recorderRef.current?.stop();

  const reRecord = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setStage("idle");
    setSeconds(0);
  };

  const send = () => {
    if (!previewUrl || pending) return;
    startTransition(async () => {
      const blob = await fetch(previewUrl).then((r) => r.blob());
      const ext = mimeTypeRef.current.includes("mp4") ? "mp4" : mimeTypeRef.current.includes("aac") ? "aac" : "webm";
      const formData = new FormData();
      formData.set("audio", blob, `voice-note.${ext}`);
      formData.set("duration", String(seconds));
      await sendVoiceNote(formData);
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setStage("idle");
      setSeconds(0);
      onSent();
    });
  };

  if (!supported) return null;

  if (stage === "idle") {
    return (
      <>
        <button type="button" className="ss-voice-mic" onClick={startRecording} aria-label="Record a voice note">
          🎙
        </button>
        {error && (
          <p className="ss-muted" style={{ width: "100%", marginTop: 8 }}>
            {error}
          </p>
        )}
      </>
    );
  }

  if (stage === "recording") {
    return (
      <div className="ss-voice-recording">
        <span className="ss-voice-dot" />
        <span className="ss-voice-timer">{fmt(seconds)}</span>
        <button type="button" className="ss-voice-stop" onClick={stopRecording} aria-label="Stop recording">
          ■
        </button>
      </div>
    );
  }

  return (
    <div className="ss-voice-preview">
      {previewUrl && <VoicePlayer src={previewUrl} duration={seconds} />}
      <div className="ss-inline" style={{ marginTop: 8 }}>
        <button type="button" className="ss-btn tiny" disabled={pending} onClick={send}>
          Send
        </button>
        <button type="button" className="ss-btn" disabled={pending} onClick={reRecord}>
          Re-record
        </button>
      </div>
    </div>
  );
}

function SealedNote({
  noteId,
  partnerName,
  text,
  when,
  audioUrl,
  durationSeconds,
  alreadyOpened,
}: {
  noteId: string;
  partnerName: string;
  text: string | null;
  when: string;
  audioUrl: string | null;
  durationSeconds: number | null;
  alreadyOpened: boolean;
}) {
  const [opened, setOpened] = useState(alreadyOpened);
  const [, startTransition] = useTransition();

  const open = () => {
    setOpened(true);
    startTransition(() => openLoveNote(noteId));
  };

  if (!opened) {
    return (
      <button
        type="button"
        className="ss-mini-envelope"
        onClick={open}
        aria-label={`Open the sealed note from ${partnerName}`}
        style={{ marginTop: 14 }}
      >
        <div className="ss-mini-env-flap" />
        <div className="ss-mini-seal">{partnerName.charAt(0).toUpperCase()}</div>
        <div className="ss-mini-env-name">A sealed note from {partnerName}</div>
      </button>
    );
  }

  return (
    <div className="ss-note-reveal" style={{ marginTop: 14 }}>
      {audioUrl && (
        <>
          <div className="ss-muted" style={{ fontSize: 12, marginBottom: 8 }}>
            A voice note from {partnerName}, {when}
          </div>
          <VoicePlayer src={audioUrl} duration={durationSeconds} />
        </>
      )}
      {text && (
        <p className="ss-entry-text" style={{ marginTop: audioUrl ? 12 : 0 }}>
          &ldquo;{text}&rdquo;
          <span
            style={{
              display: "block",
              fontFamily: "'Inter', sans-serif",
              fontSize: 12,
              color: "#2D2D2D99",
              marginTop: 4,
            }}
          >
            — the latest note from {partnerName}, {when}
          </span>
        </p>
      )}
    </div>
  );
}

export function LoveNoteCard({
  partnerName,
  latest,
}: {
  partnerName: string;
  latest: {
    id: string;
    text: string | null;
    when: string;
    openedAt: string | null;
    audioUrl: string | null;
    durationSeconds: number | null;
  } | null;
}) {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [pinged, setPinged] = useState(false);
  const [voiceSent, setVoiceSent] = useState(false);
  const [text, setText] = useState("");

  const send = (value: string) => {
    if (!value.trim() || pending) return;
    const formData = new FormData();
    formData.set("text", value.trim());
    startTransition(async () => {
      await sendLoveNote(formData);
      setText("");
      setSent(true);
      setTimeout(() => setSent(false), 2500);
    });
  };

  const ping = () => {
    if (pending) return;
    startTransition(async () => {
      await sendPing();
      setPinged(true);
      setTimeout(() => setPinged(false), 2500);
    });
  };

  return (
    <section className="ss-card col-12 ss-rosecard">
      <div className="ss-kicker">Send {partnerName} a love note ♡</div>

      <button type="button" className="ss-ping-btn" disabled={pending} onClick={ping}>
        ♡ Thinking of you, {partnerName} — send instantly
      </button>
      {pinged && (
        <p className="ss-muted" style={{ margin: "8px 0 0" }}>
          Sent — no typing required ♡
        </p>
      )}

      <div className="ss-moods" style={{ margin: "14px 0 10px" }}>
        {QUICK.map((q) => (
          <button key={q} type="button" className="ss-mood" disabled={pending} onClick={() => send(q)}>
            {q} ♡
          </button>
        ))}
      </div>
      <div className="ss-inline">
        <input
          className="ss-input"
          placeholder="Or write your own…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send(text);
          }}
        />
        <button className="ss-btn tiny" type="button" disabled={pending} onClick={() => send(text)}>
          Send
        </button>
        <VoiceRecorder onSent={() => setVoiceSent(true)} />
      </div>
      {sent && (
        <p className="ss-muted" style={{ marginTop: 10 }}>
          Sent ♡ — {partnerName} will see it the moment they open the app.
        </p>
      )}
      {voiceSent && (
        <p className="ss-muted" style={{ marginTop: 10 }}>
          Voice note sent ♡ — {partnerName} will hear it the moment they open the app.
        </p>
      )}

      {latest && (
        <SealedNote
          noteId={latest.id}
          partnerName={partnerName}
          text={latest.text}
          when={latest.when}
          audioUrl={latest.audioUrl}
          durationSeconds={latest.durationSeconds}
          alreadyOpened={Boolean(latest.openedAt)}
        />
      )}
    </section>
  );
}
