import { requireCoupleContext } from "@/lib/session";
import { RoomHeader } from "../RoomHeader";
import { TimelineForm } from "./TimelineForm";
import { ReactionBar, type Reaction } from "../ReactionBar";

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
type ReactionRow = { entry_id: string; emoji: string; user_id: string };

export default async function TimelinePage() {
  const { supabase, coupleId, userId, unreadCount, partner } = await requireCoupleContext();

  const [{ data: events }, { data: reactions }] = await Promise.all([
    supabase
      .from("timeline_events")
      .select("id, title, note, kind, is_past, event_date")
      .eq("couple_id", coupleId)
      .order("created_at", { ascending: false })
      .overrideTypes<TimelineEvent[]>(),
    supabase
      .from("reactions")
      .select("entry_id, emoji, user_id")
      .eq("couple_id", coupleId)
      .eq("entry_type", "timeline")
      .overrideTypes<ReactionRow[]>(),
  ]);

  const reactionsFor = (entryId: string): Reaction[] =>
    (reactions ?? []).filter((r) => r.entry_id === entryId).map((r) => ({ emoji: r.emoji, user_id: r.user_id }));

  return (
    <>
      <RoomHeader
        title="Timeline"
        backHref="/"
        coupleId={coupleId}
        userId={userId}
        unreadCount={unreadCount}
        partnerId={partner?.id}
        partnerName={partner?.display_name}
      />
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
              <ReactionBar entryType="timeline" entryId={t.id} userId={userId} reactions={reactionsFor(t.id)} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
