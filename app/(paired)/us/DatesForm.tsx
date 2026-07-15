"use client";

import { useTransition } from "react";
import { updateDates } from "./actions";

export function DatesForm({
  metDate,
  anniversary,
}: {
  metDate: string | null;
  anniversary: string | null;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          await updateDates(formData);
        });
      }}
    >
      <div className="ss-grid">
        <section className="ss-card col-6">
          <div className="ss-kicker">The day you met</div>
          <input
            type="date"
            name="metDate"
            className="ss-input"
            defaultValue={metDate ?? ""}
            aria-label="The day you met"
          />
          <p className="ss-muted">Drives your &quot;days together&quot; counter.</p>
        </section>
        <section className="ss-card col-6">
          <div className="ss-kicker">Your anniversary</div>
          <input
            type="date"
            name="anniversary"
            className="ss-input"
            defaultValue={anniversary ?? ""}
            aria-label="Your anniversary"
          />
          <p className="ss-muted">Drives the anniversary countdown.</p>
        </section>
      </div>
      <button className="ss-btn solid" type="submit" disabled={pending} style={{ marginTop: 4 }}>
        {pending ? "Saving…" : "Save dates"}
      </button>
    </form>
  );
}
