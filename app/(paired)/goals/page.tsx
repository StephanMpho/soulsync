import { requireCoupleContext } from "@/lib/session";
import { RoomHeader } from "../RoomHeader";
import { AddInline } from "../AddInline";
import { bumpGoal, addGoal, toggleHabit, addHabit } from "./actions";

type Goal = { id: string; name: string; pct: number; owner_id: string | null };
type Habit = { id: string; name: string; done: boolean };

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="ss-bar">
      <i style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
    </div>
  );
}

export default async function GoalsPage() {
  const { supabase, coupleId, userId, displayName, partner, unreadCount } = await requireCoupleContext();

  const [{ data: goals }, { data: habits }] = await Promise.all([
    supabase
      .from("goals")
      .select("id, name, pct, owner_id")
      .eq("couple_id", coupleId)
      .order("created_at")
      .overrideTypes<Goal[]>(),
    supabase.from("habits").select("id, name, done").eq("couple_id", coupleId).overrideTypes<Habit[]>(),
  ]);

  const shared = (goals ?? []).filter((g) => g.owner_id === null);
  const mine = (goals ?? []).filter((g) => g.owner_id === userId);
  const theirs = partner ? (goals ?? []).filter((g) => g.owner_id === partner.id) : [];

  const columns = [
    { label: "Shared", scope: "shared", list: shared, color: "#D6B370", col: "col-12" },
    { label: displayName, scope: "mine", list: mine, color: "#3F7D58", col: partner ? "col-6" : "col-12" },
    ...(partner
      ? [{ label: partner.display_name, scope: "theirs", list: theirs, color: "#3F7D58", col: "col-6" }]
      : []),
  ];

  return (
    <>
      <RoomHeader
        title="Goals"
        backHref="/"
        coupleId={coupleId}
        userId={userId}
        unreadCount={unreadCount}
        partnerId={partner?.id}
        partnerName={partner?.display_name}
      />
      <section className="ss-hero slim">
        <h1 className="ss-greet sm">
          Goals & <em>habits</em>
        </h1>
        <p className="ss-sub">Nudge progress with − and +. Saved as you go.</p>
      </section>

      <div className="ss-grid">
        {columns.map((col) => (
          <section className={`ss-card ${col.col}`} key={col.scope}>
            <div className="ss-kicker">{col.label}</div>
            {col.list.map((g) => (
              <div className="ss-goal" key={g.id}>
                <div className="ss-goal-head">
                  <span>{g.name}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="pct">{g.pct}%</span>
                    <span className="ss-steppers">
                      <form action={bumpGoal}>
                        <input type="hidden" name="id" value={g.id} />
                        <input type="hidden" name="delta" value="-5" />
                        <button className="ss-step" aria-label={`Decrease ${g.name}`}>
                          −
                        </button>
                      </form>
                      <form action={bumpGoal}>
                        <input type="hidden" name="id" value={g.id} />
                        <input type="hidden" name="delta" value="5" />
                        <button className="ss-step" aria-label={`Increase ${g.name}`}>
                          +
                        </button>
                      </form>
                    </span>
                  </span>
                </div>
                <Bar pct={g.pct} color={col.color} />
              </div>
            ))}
            <AddInline
              placeholder={`New ${col.label.toLowerCase()} goal…`}
              action={addGoal}
              hidden={{
                scope: col.scope,
                ...(col.scope === "theirs" && partner ? { partnerId: partner.id } : {}),
              }}
            />
          </section>
        ))}

        <section className="ss-card col-12">
          <div className="ss-kicker">This week&apos;s habits</div>
          <div className="ss-habits">
            {(habits ?? []).map((h) => (
              <form action={toggleHabit} key={h.id}>
                <input type="hidden" name="id" value={h.id} />
                <input type="hidden" name="done" value={String(h.done)} />
                <input type="hidden" name="name" value={h.name} />
                <button className={`ss-habit ${h.done ? "done" : ""}`} aria-pressed={h.done} type="submit">
                  <span className="ss-check">{h.done ? "✓" : ""}</span>
                  {h.name}
                </button>
              </form>
            ))}
          </div>
          <AddInline placeholder="New habit…" action={addHabit} />
        </section>
      </div>
    </>
  );
}
