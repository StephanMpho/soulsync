import { requireCoupleContext } from "@/lib/session";
import { RoomHeader } from "../RoomHeader";
import { CapsuleForm } from "./CapsuleForm";
import { openCapsule } from "./actions";

type Capsule = {
  id: string;
  author_id: string;
  title: string;
  body: string | null;
  unlock_date: string;
  opened_at: string | null;
};

export default async function CapsulesPage() {
  const { supabase, coupleId, userId, displayName, partner, unreadCount } = await requireCoupleContext();

  // Reads from the masked view (migration 0006), not the base table — the
  // body column comes back null here until unlock_date, enforced by the
  // database itself rather than just hidden by this page's markup.
  const { data: capsules } = await supabase
    .from("capsules_view")
    .select("id, author_id, title, body, unlock_date, opened_at")
    .eq("couple_id", coupleId)
    .order("unlock_date")
    .overrideTypes<Capsule[]>();

  const list = capsules ?? [];

  return (
    <>
      <RoomHeader title="Capsules" backHref="/more" coupleId={coupleId} userId={userId} unreadCount={unreadCount} />
      <section className="ss-hero slim">
        <h1 className="ss-greet sm">
          Time <em>capsules</em>
        </h1>
        <p className="ss-sub">
          Seal a letter today — it can only be opened on the date you choose. Not even the person who
          wrote it can peek early.
        </p>
      </section>

      <CapsuleForm />

      <div className="ss-navlist" style={{ marginTop: 16 }}>
        {list.length === 0 && (
          <div className="ss-card">
            <p className="ss-muted" style={{ margin: 0 }}>
              No capsules yet. Try sealing one for your anniversary — future-you will thank you.
            </p>
          </div>
        )}
        {list.map((c) => {
          const unlockable = new Date(c.unlock_date + "T00:00:00") <= new Date();
          const wait = Math.max(
            0,
            Math.ceil((new Date(c.unlock_date + "T00:00:00").getTime() - Date.now()) / 864e5)
          );
          const authorName = c.author_id === userId ? displayName : (partner?.display_name ?? "Your partner");

          return (
            <div className="ss-card" key={c.id}>
              <div className="ss-tl-when">
                Sealed by {authorName} · unlocks {c.unlock_date}
              </div>
              <h3>{c.title}</h3>
              {c.opened_at ? (
                <p className="ss-entry-text">&ldquo;{c.body}&rdquo;</p>
              ) : unlockable ? (
                <form action={openCapsule}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="title" value={c.title} />
                  <button className="ss-btn solid" type="submit">
                    Break the seal ✦
                  </button>
                </form>
              ) : (
                <p className="ss-muted" style={{ margin: 0 }}>
                  Sealed — {wait} day{wait === 1 ? "" : "s"} to go. Not even{" "}
                  {c.author_id === userId ? "you" : authorName} can open it early.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
