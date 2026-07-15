"use client";

import { useRef, useTransition } from "react";
import { contribute } from "./actions";

export function ContributeForm({ fundId, fundName }: { fundId: string; fundName: string }) {
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      className="ss-inline"
      style={{ flex: 1, minWidth: 210 }}
      action={(formData) => {
        formData.set("fundId", fundId);
        formData.set("fundName", fundName);
        startTransition(async () => {
          await contribute(formData);
          formRef.current?.reset();
        });
      }}
    >
      <input className="ss-input" type="number" min="1" name="amount" placeholder="Amount (R)" required />
      <button className="ss-btn tiny" type="submit" disabled={pending}>
        Contribute
      </button>
    </form>
  );
}
