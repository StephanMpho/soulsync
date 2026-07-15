import { requireCoupleContext } from "@/lib/session";
import { RoomHeader } from "../RoomHeader";
import { JournalForm } from "./JournalForm";

type Entry = { id: string; kind: string; body: string; author_id: string; created_at: string };

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default async function JournalPage() {
  const { supabase, coupleId, displayName, userId, partner, unreadCount } = await requireCoupleContext();

  const { data: entries } = await supabase
    .from("journal_entries")
    .select("id, kind, body, author_id, created_at")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false })
    .overrideTypes<Entry[]>();

  const nameFor = (authorId: string) =>
    authorId === userId ? displayName : (partner?.display_name ?? "Partner");

  return (
    <>
      <RoomHeader title="Journal" backHref="/" coupleId={coupleId} userId={userId} unreadCount={unreadCount} />
      <section className="ss-hero slim">
        <h1 className="ss-greet sm">
          Couple <em>journal</em>
        </h1>
        <p className="ss-sub">Writing as {displayName}. Private to the two of you — and kept.</p>
      </section>

      <div className="ss-grid">
        <JournalForm partnerName={partner?.display_name ?? null} />
        <section className="col-7">
          {(entries ?? []).length === 0 && (
            <div className="ss-card">
              <p className="ss-muted" style={{ margin: 0 }}>
                No entries yet. The first page of a journal is an invitation, not a demand.
              </p>
            </div>
          )}
          {(entries ?? []).map((e) => (
            <div className="ss-card ss-entry" key={e.id}>
              <div className="ss-tl-when">
                {capitalize(e.kind)} · {nameFor(e.author_id)} ·{" "}
                {new Date(e.created_at).toLocaleDateString("en-ZA", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </div>
              <p className="ss-entry-text">{e.body}</p>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
