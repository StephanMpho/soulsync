import { requireCoupleContext } from "@/lib/session";
import { RoomHeader } from "../RoomHeader";
import { JournalForm } from "./JournalForm";
import { ReactionBar, type Reaction } from "../ReactionBar";

type Entry = { id: string; kind: string; body: string; author_id: string; created_at: string };
type ReactionRow = { entry_id: string; emoji: string; user_id: string };

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default async function JournalPage() {
  const { supabase, coupleId, displayName, userId, partner, unreadCount } = await requireCoupleContext();

  const [{ data: entries }, { data: reactions }] = await Promise.all([
    supabase
      .from("journal_entries")
      .select("id, kind, body, author_id, created_at")
      .eq("couple_id", coupleId)
      .order("created_at", { ascending: false })
      .overrideTypes<Entry[]>(),
    supabase
      .from("reactions")
      .select("entry_id, emoji, user_id")
      .eq("couple_id", coupleId)
      .eq("entry_type", "journal")
      .overrideTypes<ReactionRow[]>(),
  ]);

  const reactionsFor = (entryId: string): Reaction[] =>
    (reactions ?? []).filter((r) => r.entry_id === entryId).map((r) => ({ emoji: r.emoji, user_id: r.user_id }));

  const nameFor = (authorId: string) =>
    authorId === userId ? displayName : (partner?.display_name ?? "Partner");

  return (
    <>
      <RoomHeader
        title="Journal"
        backHref="/"
        coupleId={coupleId}
        userId={userId}
        unreadCount={unreadCount}
        partnerId={partner?.id}
        partnerName={partner?.display_name}
      />
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
              <ReactionBar entryType="journal" entryId={e.id} userId={userId} reactions={reactionsFor(e.id)} />
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
