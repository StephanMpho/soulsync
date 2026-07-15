"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function NotificationBell({
  coupleId,
  userId,
  initialUnread,
}: {
  coupleId: string;
  userId: string;
  initialUnread: number;
}) {
  const router = useRouter();
  const [unread, setUnread] = useState(initialUnread);

  useEffect(() => {
    setUnread(initialUnread);
  }, [initialUnread]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`activity-${coupleId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity", filter: `couple_id=eq.${coupleId}` },
        (payload) => {
          if ((payload.new as { actor_id: string }).actor_id !== userId) {
            setUnread((n) => n + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, userId]);

  return (
    <button
      className="ss-bell"
      onClick={() => router.push("/alerts")}
      aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
    >
      ♡
      {unread > 0 && <span className="ss-badge">{unread}</span>}
    </button>
  );
}
