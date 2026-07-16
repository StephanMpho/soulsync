import Link from "next/link";
import { requireCoupleContext } from "@/lib/session";
import { RoomHeader } from "../RoomHeader";
import { MORE_ROOMS } from "@/lib/rooms";

export default async function MorePage() {
  const { coupleId, userId, unreadCount, partner } = await requireCoupleContext();

  return (
    <>
      <RoomHeader
        title="More"
        backHref="/"
        coupleId={coupleId}
        userId={userId}
        unreadCount={unreadCount}
        partnerId={partner?.id}
        partnerName={partner?.display_name}
      />
      <section className="ss-hero slim">
        <h1 className="ss-greet sm">
          More of <em>your home</em>
        </h1>
      </section>
      <div className="ss-navlist">
        {MORE_ROOMS.map((room) => (
          <Link key={room.name} className="ss-navcard" href={room.href}>
            <span className="ss-navicon">{room.icon}</span>
            <span>
              <b>{room.name}</b>
              <small>{room.desc}</small>
            </span>
            <span className="ss-chev">›</span>
          </Link>
        ))}
      </div>
    </>
  );
}
