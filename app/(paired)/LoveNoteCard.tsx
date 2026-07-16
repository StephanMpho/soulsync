"use client";

import { useState, useTransition } from "react";
import { sendLoveNote, sendPing, openLoveNote } from "./actions";

const QUICK = ["Thinking of you", "Miss you", "So proud of you", "Can't wait to see you"];

function SealedNote({
  noteId,
  partnerName,
  text,
  when,
}: {
  noteId: string;
  partnerName: string;
  text: string;
  when: string;
}) {
  const [opened, setOpened] = useState(false);
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
    <p className="ss-entry-text ss-note-reveal" style={{ marginTop: 14 }}>
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
  );
}

export function LoveNoteCard({
  partnerName,
  latest,
}: {
  partnerName: string;
  latest: { id: string; text: string; when: string; openedAt: string | null } | null;
}) {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [pinged, setPinged] = useState(false);
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
      </div>
      {sent && (
        <p className="ss-muted" style={{ marginTop: 10 }}>
          Sent ♡ — {partnerName} will see it the moment they open the app.
        </p>
      )}

      {latest &&
        (latest.openedAt ? (
          <p className="ss-entry-text" style={{ marginTop: 14 }}>
            &ldquo;{latest.text}&rdquo;
            <span
              style={{
                display: "block",
                fontFamily: "'Inter', sans-serif",
                fontSize: 12,
                color: "#2D2D2D99",
                marginTop: 4,
              }}
            >
              — the latest note from {partnerName}, {latest.when}
            </span>
          </p>
        ) : (
          <SealedNote noteId={latest.id} partnerName={partnerName} text={latest.text} when={latest.when} />
        ))}
    </section>
  );
}
