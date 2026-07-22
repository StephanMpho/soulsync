"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { completeDailyPrompt } from "./actions";

export function DailyPromptCard({
  prompt,
  partnerName,
  streak,
  gardenCount,
  myDoneToday,
  partnerDoneToday,
  partnerNoteToday,
}: {
  prompt: string;
  partnerName: string;
  streak: number;
  gardenCount: number;
  myDoneToday: boolean;
  partnerDoneToday: boolean;
  partnerNoteToday: string | null;
}) {
  const [done, setDone] = useState(myDoneToday);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  const complete = () => {
    if (done || pending) return;
    setDone(true);
    startTransition(() => completeDailyPrompt(note));
  };

  return (
    <section className="ss-card ss-rosecard col-12">
      <div className="ss-kicker">Today&apos;s shared moment</div>
      <p className="ss-entry-text" style={{ margin: "0 0 12px" }}>
        {prompt}
      </p>

      {partnerDoneToday && partnerNoteToday && (
        <p className="ss-muted" style={{ margin: "0 0 12px", fontStyle: "italic" }}>
          {partnerName}: &ldquo;{partnerNoteToday}&rdquo;
        </p>
      )}

      {done ? (
        <p className="ss-muted" style={{ margin: 0 }}>
          {partnerDoneToday || partnerName === ""
            ? "Done ♡ — today's flower is in the garden."
            : `Done ♡ — waiting on ${partnerName}.`}
        </p>
      ) : (
        <>
          <textarea
            className="ss-input"
            rows={2}
            placeholder={`Say what you did or told ${partnerName || "them"} (optional)`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{ marginBottom: 10 }}
          />
          <button type="button" className="ss-btn solid" disabled={pending} onClick={complete}>
            {pending ? "Saving…" : "I did this ♡"}
          </button>
          {partnerDoneToday && !partnerNoteToday && (
            <p className="ss-muted" style={{ margin: "8px 0 0" }}>
              {partnerName} already did — your turn.
            </p>
          )}
        </>
      )}

      <div className="ss-inline" style={{ marginTop: 14, justifyContent: "space-between" }}>
        <span className="ss-muted">
          {streak > 0 ? `🔥 ${streak} day streak` : "Start your streak today"} · {gardenCount}{" "}
          {gardenCount === 1 ? "flower" : "flowers"}
        </span>
        <Link href="/garden" className="ss-voice-history-link" style={{ margin: 0 }}>
          See your garden →
        </Link>
      </div>
    </section>
  );
}
