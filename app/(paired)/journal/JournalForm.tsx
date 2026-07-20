"use client";

import { useRef, useState, useTransition } from "react";
import { addJournalEntry } from "./actions";
import { PhotoPicker } from "../PhotoPicker";
import { compressImage } from "../compressImage";

const KINDS = ["reflection", "gratitude", "letter"] as const;
const LABELS: Record<string, string> = {
  reflection: "Reflection",
  gratitude: "Gratitude",
  letter: "Letter",
};

export function JournalForm({ partnerName }: { partnerName: string | null }) {
  const [kind, setKind] = useState<string>("reflection");
  const [pending, startTransition] = useTransition();
  const [photoKey, setPhotoKey] = useState(0);
  const [photoWarning, setPhotoWarning] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const placeholder =
    kind === "gratitude"
      ? "Today I'm grateful for…"
      : kind === "letter"
        ? `Dear ${partnerName ?? "you"}…`
        : "What's on your heart?";

  return (
    <section className="ss-card col-5" style={{ alignSelf: "start" }}>
      <div className="ss-kicker">New entry</div>
      <div className="ss-moods" style={{ marginBottom: 12 }}>
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            className={`ss-mood ${kind === k ? "sel" : ""}`}
            onClick={() => setKind(k)}
          >
            {LABELS[k]}
          </button>
        ))}
      </div>
      <form
        ref={formRef}
        action={(formData) => {
          formData.set("kind", kind);
          startTransition(async () => {
            const photo = formData.get("photo");
            if (photo instanceof File && photo.size > 0) {
              formData.set("photo", await compressImage(photo), "photo.jpg");
            }
            const result = await addJournalEntry(formData);
            setPhotoWarning(Boolean(result?.photoFailed));
            formRef.current?.reset();
            setPhotoKey((k) => k + 1);
          });
        }}
      >
        <textarea className="ss-input" name="body" rows={5} placeholder={placeholder} required />
        <PhotoPicker key={photoKey} />
        {photoWarning && (
          <p className="ss-muted" style={{ marginTop: 8 }}>
            Saved, but the photo couldn&apos;t attach — try adding it again.
          </p>
        )}
        <button className="ss-btn solid" type="submit" disabled={pending} style={{ marginTop: 12 }}>
          {pending ? "Saving…" : "Add to your story"}
        </button>
      </form>
    </section>
  );
}
