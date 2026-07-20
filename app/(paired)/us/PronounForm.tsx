"use client";

import { useTransition } from "react";
import { updatePronoun } from "./actions";

const OPTIONS = [
  { value: "she", label: "She / her" },
  { value: "he", label: "He / him" },
  { value: "they", label: "They / them" },
] as const;

export function PronounForm({ displayName, pronoun }: { displayName: string; pronoun: string | null }) {
  const [pending, startTransition] = useTransition();

  return (
    <section className="ss-card col-12">
      <div className="ss-kicker">How prompts should refer to you</div>
      <p className="ss-muted" style={{ marginBottom: 10 }}>
        {displayName}&apos;s pronoun — used so the daily shared prompt can say &quot;tell her&quot; or &quot;tell
        him&quot; correctly, instead of guessing.
      </p>
      <form
        action={(formData) => {
          startTransition(() => updatePronoun(formData));
        }}
      >
        <div className="ss-moods">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              type="submit"
              name="pronoun"
              value={o.value}
              disabled={pending}
              className={`ss-mood ${pronoun === o.value ? "sel" : ""}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </form>
    </section>
  );
}
