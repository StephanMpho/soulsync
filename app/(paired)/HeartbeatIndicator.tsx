"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="15" height="15" aria-hidden="true">
      <path d="M12 21s-7.5-4.6-10.2-9.3C.3 8.9 1.4 5.4 4.6 4.2c2-.8 4.2-.1 5.6 1.6l1.8 2.2 1.8-2.2c1.4-1.7 3.6-2.4 5.6-1.6 3.2 1.2 4.3 4.7 2.8 7.5C19.5 16.4 12 21 12 21z" />
    </svg>
  );
}

// Presence lives entirely in Supabase Realtime's in-memory state, not
// Postgres — no table, no RLS, no migration. The connection itself is the
// heartbeat: closing the tab or losing network drops your presence entry
// automatically, no expiry logic to write.
//
// Rendered as a compact icon-only badge (matching the notification bell's
// circle) rather than inline text — the header already holds the wordmark,
// bell, and sign-out button, and "Konanani isn't here right now" alongside
// all of that overflowed the row on a real phone width.
export function HeartbeatIndicator({
  coupleId,
  userId,
  partnerId,
  partnerName,
}: {
  coupleId: string;
  userId: string;
  partnerId: string;
  partnerName: string;
}) {
  const [selfHere, setSelfHere] = useState(false);
  const [partnerHere, setPartnerHere] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`presence-${coupleId}`, {
      config: { presence: { key: userId } },
    });

    const sync = () => {
      const state = channel.presenceState();
      setSelfHere(Boolean(state[userId]?.length));
      setPartnerHere(Boolean(state[partnerId]?.length));
    };

    channel.on("presence", { event: "sync" }, sync).subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ online_at: new Date().toISOString() });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, userId, partnerId]);

  const state = selfHere && partnerHere ? "both" : partnerHere ? "her" : "alone";

  const label =
    state === "both"
      ? "Together, right now"
      : state === "her"
        ? `${partnerName} is here`
        : `${partnerName} isn't here right now`;

  return (
    <div className="ss-hb-badge" title={label} aria-label={label}>
      {state === "both" ? (
        <HeartIcon className="ss-hb-heart pulse" />
      ) : (
        <span className={`ss-hb-dot ${state === "her" ? "on" : ""}`} />
      )}
    </div>
  );
}
