"use client";

import { useState } from "react";

export function WaitingCard({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const link = typeof window !== "undefined" ? `${window.location.origin}/invite/${token}` : "";

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="ss-card ss-rosecard col-12">
      <div className="ss-kicker">Waiting on your invitation</div>
      <h3>The letter is sealed and sent</h3>
      <p className="ss-muted" style={{ marginBottom: 12 }}>
        Your home opens fully once they accept. Here&apos;s the link again, if you need to resend it.
      </p>
      <div className="ss-inline">
        <input className="ss-input" readOnly value={link} onFocus={(e) => e.target.select()} />
        <button className="ss-btn tiny" onClick={copy}>{copied ? "Copied ✓" : "Copy"}</button>
      </div>
    </section>
  );
}
