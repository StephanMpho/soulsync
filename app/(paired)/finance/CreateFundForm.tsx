"use client";

import { useRef, useTransition } from "react";
import { addFund } from "./actions";

export function CreateFundForm() {
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      className="ss-inline"
      style={{ marginTop: 14 }}
      action={(formData) => {
        startTransition(async () => {
          await addFund(formData);
          formRef.current?.reset();
        });
      }}
    >
      <input className="ss-input" name="name" placeholder="New fund name…" required />
      <input
        className="ss-input"
        name="target"
        type="number"
        min="1"
        placeholder="Target (R)"
        required
        style={{ maxWidth: 140 }}
      />
      <button className="ss-btn tiny" type="submit" disabled={pending}>
        Add
      </button>
    </form>
  );
}
