import { requireCoupleContext } from "@/lib/session";
import { RoomHeader } from "../RoomHeader";
import { AddInline } from "../AddInline";
import { togglePackingItem, addPackingItem } from "./actions";

type Item = { id: string; name: string; done: boolean };

export default async function TravelPage() {
  const { supabase, coupleId, userId, unreadCount, partner } = await requireCoupleContext();

  const { data: items } = await supabase
    .from("packing_items")
    .select("id, name, done")
    .eq("couple_id", coupleId)
    .order("created_at")
    .overrideTypes<Item[]>();

  return (
    <>
      <RoomHeader
        title="Travel"
        backHref="/more"
        coupleId={coupleId}
        userId={userId}
        unreadCount={unreadCount}
        partnerId={partner?.id}
        partnerName={partner?.display_name}
      />
      <section className="ss-hero slim">
        <h1 className="ss-greet sm">
          Travel <em>together</em>
        </h1>
        <p className="ss-sub">The packing list remembers what you&apos;ve ticked.</p>
      </section>

      <div className="ss-grid">
        <section className="ss-card col-12">
          <div className="ss-kicker">Packing list</div>
          <div className="ss-habits">
            {(items ?? []).map((p) => (
              <form action={togglePackingItem} key={p.id}>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="done" value={String(p.done)} />
                <button className={`ss-habit ${p.done ? "done" : ""}`} aria-pressed={p.done} type="submit">
                  <span className="ss-check">{p.done ? "✓" : ""}</span>
                  {p.name}
                </button>
              </form>
            ))}
            {(items ?? []).length === 0 && (
              <p className="ss-muted" style={{ margin: 0 }}>
                Nothing on the list yet.
              </p>
            )}
          </div>
          <AddInline placeholder="Add to packing list…" action={addPackingItem} />
        </section>
      </div>
    </>
  );
}
