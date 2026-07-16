import Link from "next/link";
import { SignOutButton } from "@/app/SignOutButton";
import { NotificationBell } from "./NotificationBell";
import { HeartbeatIndicator } from "./HeartbeatIndicator";

export function RoomHeader({
  title,
  backHref,
  coupleId,
  userId,
  unreadCount,
  partnerId,
  partnerName,
}: {
  title: string;
  backHref: string;
  coupleId: string;
  userId: string;
  unreadCount: number;
  partnerId?: string;
  partnerName?: string;
}) {
  return (
    <header className="ss-topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <Link className="ss-back" href={backHref} aria-label="Go back">
          ←
        </Link>
        <span className="ss-screen-title">{title}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {partnerId && partnerName && (
          <HeartbeatIndicator coupleId={coupleId} userId={userId} partnerId={partnerId} partnerName={partnerName} />
        )}
        <NotificationBell coupleId={coupleId} userId={userId} initialUnread={unreadCount} />
        <SignOutButton />
      </div>
    </header>
  );
}
