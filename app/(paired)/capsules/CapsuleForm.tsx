"use client";

import { useRef, useState, useTransition } from "react";
import { sealCapsule } from "./actions";

export function CapsuleForm() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <button className="ss-btn solid" onClick={() => setOpen(true)}>
        ＋ Seal a new capsule
      </button>
    );
  }

  return (
    <section className="ss-card" style={{ marginTop: 8 }}>
      <div className="ss-kicker">New capsule</div>
      <form
        ref={formRef}
        action={(formData) => {
          startTransition(async () => {
            await sealCapsule(formData);
            setOpen(false);
          });
        }}
      >
        <input className="ss-input" name="title" placeholder="Open when… (e.g. Our anniversary)" required />
        <textarea className="ss-input" name="body" rows={4} placeholder="Dear us…" required />
        <label className="ss-muted" style={{ display: "block", marginBottom: 4 }}>
          Unlock date
        </label>
        <input type="date" name="unlockDate" className="ss-input" required />
        <div style={{ display: "flex", gap: 8 }}>
          <button className="ss-btn solid" type="submit" disabled={pending}>
            {pending ? "Sealing…" : "Seal it ✦"}
          </button>
          <button className="ss-btn" type="button" onClick={() => setOpen(false)}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
