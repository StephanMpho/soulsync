"use client";

import { useState, useTransition } from "react";
import { sendLoveNote } from "./actions";

const QUICK = ["Thinking of you", "Miss you", "So proud of you", "Can't wait to see you"];

export function LoveNoteCard({
  partnerName,
  latest,
}: {
  partnerName: string;
  latest: { text: string; when: string } | null;
}) {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
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

  return (
    <section className="ss-card col-12 ss-rosecard">
      <div className="ss-kicker">Send {partnerName} a love note ♡</div>
      <div className="ss-moods" style={{ marginBottom: 10 }}>
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
      {latest && (
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
      )}
    </section>
  );
}
