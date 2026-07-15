import { requireCoupleContext } from "@/lib/session";
import { RoomHeader } from "../RoomHeader";

type Activity = { id: string; actor_id: string; payload: { text: string }; created_at: string };

export default async function AlertsPage() {
  const { supabase, coupleId, userId, partner } = await requireCoupleContext();

  // Visiting this page is what clears the bell — mark everything seen
  // before rendering so the next page load's unread count reflects it.
  await supabase.rpc("mark_activity_seen");

  const { data: activity } = await supabase
    .from("activity")
    .select("id, actor_id, payload, created_at")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false })
    .overrideTypes<Activity[]>();

  const list = activity ?? [];

  return (
    <>
      <RoomHeader title="Alerts" backHref="/" coupleId={coupleId} userId={userId} unreadCount={0} />
      <section className="ss-hero slim">
        <h1 className="ss-greet sm">
          While you were <em>away</em>
        </h1>
        <p className="ss-sub">
          Everything {partner?.display_name ?? "your partner"} adds shows up here the moment you open
          the app — memories, journal entries, goals, contributions.
        </p>
      </section>

      {list.length === 0 ? (
        <div className="ss-card">
          <p className="ss-muted" style={{ margin: 0 }}>
            Nothing yet. When either of you adds something, the other will see it here.
          </p>
        </div>
      ) : (
        <div className="ss-navlist">
          {list.map((a) => (
            <div className="ss-card" key={a.id} style={{ padding: "14px 18px" }}>
              <div className="ss-tl-when">
                {new Date(a.created_at).toLocaleDateString("en-ZA", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
                {a.actor_id === userId ? " · you" : ""}
              </div>
              <p style={{ margin: 0, fontSize: 14 }}>{a.payload.text}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
