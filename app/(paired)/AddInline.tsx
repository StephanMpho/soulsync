"use client";

import { useRef, useTransition } from "react";

export function AddInline({
  placeholder,
  action,
  hidden,
}: {
  placeholder: string;
  action: (formData: FormData) => Promise<void>;
  hidden?: Record<string, string>;
}) {
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      className="ss-inline"
      style={{ marginTop: 14 }}
      action={(formData) => {
        startTransition(async () => {
          await action(formData);
          formRef.current?.reset();
        });
      }}
    >
      {hidden &&
        Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <input className="ss-input" name="name" placeholder={placeholder} required />
      <button className="ss-btn tiny" type="submit" disabled={pending}>
        Add
      </button>
    </form>
  );
}
