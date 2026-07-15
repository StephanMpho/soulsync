import Link from "next/link";
import { SignOutButton } from "@/app/SignOutButton";
import { NotificationBell } from "./NotificationBell";

export function RoomHeader({
  title,
  backHref,
  coupleId,
  userId,
  unreadCount,
}: {
  title: string;
  backHref: string;
  coupleId: string;
  userId: string;
  unreadCount: number;
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
        <NotificationBell coupleId={coupleId} userId={userId} initialUnread={unreadCount} />
        <SignOutButton />
      </div>
    </header>
  );
}
