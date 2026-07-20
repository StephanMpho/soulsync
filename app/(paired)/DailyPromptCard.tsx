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
}: {
  prompt: string;
  partnerName: string;
  streak: number;
  gardenCount: number;
  myDoneToday: boolean;
  partnerDoneToday: boolean;
}) {
  const [done, setDone] = useState(myDoneToday);
  const [pending, startTransition] = useTransition();

  const complete = () => {
    if (done || pending) return;
    setDone(true);
    startTransition(() => completeDailyPrompt());
  };

  return (
    <section className="ss-card ss-rosecard col-12">
      <div className="ss-kicker">Today&apos;s shared moment</div>
      <p className="ss-entry-text" style={{ margin: "0 0 12px" }}>
        {prompt}
      </p>

      {done ? (
        <p className="ss-muted" style={{ margin: 0 }}>
          {partnerDoneToday || partnerName === ""
            ? "Done ♡ — today's flower is in the garden."
            : `Done ♡ — waiting on ${partnerName}.`}
        </p>
      ) : (
        <>
          <button type="button" className="ss-btn solid" disabled={pending} onClick={complete}>
            {pending ? "Saving…" : "I did this ♡"}
          </button>
          {partnerDoneToday && (
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
