"use client";

import { useState, useTransition } from "react";
import { addTimelineEvent } from "./actions";

export function TimelineForm() {
  const [open, setOpen] = useState(false);
  const [future, setFuture] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button className="ss-btn solid" onClick={() => setOpen(true)}>
        ＋ Add a memory or dream
      </button>
    );
  }

  return (
    <form
      className="ss-card"
      style={{ marginTop: 8 }}
      action={(formData) => {
        formData.set("future", String(future));
        startTransition(async () => {
          await addTimelineEvent(formData);
          setOpen(false);
          setFuture(false);
        });
      }}
    >
      <div className="ss-kicker">Add to the thread</div>
      <div className="ss-moods" style={{ marginBottom: 10 }}>
        <button type="button" className={`ss-mood ${!future ? "sel" : ""}`} onClick={() => setFuture(false)}>
          A memory (past)
        </button>
        <button type="button" className={`ss-mood ${future ? "sel" : ""}`} onClick={() => setFuture(true)}>
          A dream (future)
        </button>
      </div>
      <input
        className="ss-input"
        name="title"
        placeholder={future ? "One day we will…" : "What happened?"}
        required
      />
      <input className="ss-input" name="note" placeholder="A line to remember it by (optional)" />
      <div style={{ display: "flex", gap: 8 }}>
        <button className="ss-btn solid" type="submit" disabled={pending}>
          {pending ? "Saving…" : "Place it on the timeline"}
        </button>
        <button className="ss-btn" type="button" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}
