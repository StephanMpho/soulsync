import { requireCoupleContext } from "@/lib/session";
import { RoomHeader } from "../RoomHeader";
import { TimelineForm } from "./TimelineForm";

function formatWhen(eventDate: string | null) {
  if (!eventDate) return "Someday";
  return new Date(eventDate + "T00:00:00").toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type TimelineEvent = {
  id: string;
  title: string;
  note: string | null;
  kind: string;
  is_past: boolean;
  event_date: string | null;
};

export default async function TimelinePage() {
  const { supabase, coupleId, userId, unreadCount } = await requireCoupleContext();

  const { data: events } = await supabase
    .from("timeline_events")
    .select("id, title, note, kind, is_past, event_date")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false })
    .overrideTypes<TimelineEvent[]>();

  return (
    <>
      <RoomHeader title="Timeline" backHref="/" coupleId={coupleId} userId={userId} unreadCount={unreadCount} />
      <section className="ss-hero slim">
        <h1 className="ss-greet sm">
          Your <em>living timeline</em>
        </h1>
        <p className="ss-sub">Past memories and future dreams on one thread.</p>
      </section>

      <TimelineForm />

      <div className="ss-tl">
        {(events ?? []).map((t) => (
          <div className={`ss-tl-item ${t.is_past ? "" : "future"}`} key={t.id}>
            <span className="ss-tl-dot" />
            <div className="ss-card ss-tl-card">
              <div className="ss-tl-when">
                {formatWhen(t.event_date)} ·{" "}
                <span className="ss-tl-kind">
                  {t.is_past ? capitalize(t.kind) : `${capitalize(t.kind)} · ahead`}
                </span>
              </div>
              <h3>{t.title}</h3>
              {t.note && <p className="ss-muted">{t.note}</p>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
