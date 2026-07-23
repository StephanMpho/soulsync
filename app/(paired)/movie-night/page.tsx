import { requireCoupleContext } from "@/lib/session";
import { RoomHeader } from "../RoomHeader";
import { MovieNightRoom } from "./MovieNightRoom";

type MovieNight = {
  id: string;
  title: string;
  service: string;
  scheduled_at: string;
  status: "scheduled" | "live" | "ended";
  started_at: string | null;
  created_by: string;
  url: string | null;
  logged_at: string | null;
};

export default async function MovieNightPage() {
  const { supabase, coupleId, userId, displayName, partner, unreadCount } = await requireCoupleContext();

  // Every movie night for the couple — scheduled, live, and ended — so
  // several can be scheduled at once and past ones stay as real history
  // instead of only ever showing a single "current" one.
  const { data: movieNights } = await supabase
    .from("movie_nights")
    .select("id, title, service, scheduled_at, status, started_at, created_by, url, logged_at")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false })
    .overrideTypes<MovieNight[]>();

  return (
    <>
      <RoomHeader
        title="Movie Night"
        backHref="/more"
        coupleId={coupleId}
        userId={userId}
        unreadCount={unreadCount}
        partnerId={partner?.id}
        partnerName={partner?.display_name}
      />
      <section className="ss-hero slim">
        <h1 className="ss-greet sm">
          Same story, <em>same second</em>
        </h1>
        <p className="ss-sub">
          SoulSync doesn&apos;t play the film — each of you watches on your own account. This keeps you in sync and
          carries the reactions.
        </p>
      </section>

      {partner ? (
        <MovieNightRoom
          coupleId={coupleId}
          userId={userId}
          displayName={displayName}
          partnerName={partner.display_name}
          initial={movieNights ?? []}
        />
      ) : (
        <div className="ss-card">
          <p className="ss-muted" style={{ margin: 0 }}>
            Movie Night needs your partner paired first.
          </p>
        </div>
      )}
    </>
  );
}
