import { requireCoupleContext } from "@/lib/session";
import { RoomHeader } from "../RoomHeader";
import { Ring } from "./Ring";
import { ContributeForm } from "./ContributeForm";
import { CreateFundForm } from "./CreateFundForm";

type Fund = { id: string; name: string; target_cents: number; saved_cents: number };

function fmtR(cents: number) {
  return "R" + (cents / 100).toLocaleString("en-ZA");
}

export default async function FinancePage() {
  const { supabase, coupleId, userId, unreadCount } = await requireCoupleContext();

  const { data: funds } = await supabase
    .from("funds")
    .select("id, name, target_cents, saved_cents")
    .eq("couple_id", coupleId)
    .order("created_at")
    .overrideTypes<Fund[]>();

  const list = funds ?? [];
  const closest = list.length
    ? [...list].sort((a, b) => b.saved_cents / b.target_cents - a.saved_cents / a.target_cents)[0]
    : null;
  const left = closest ? closest.target_cents - closest.saved_cents : 0;

  return (
    <>
      <RoomHeader title="Finance" backHref="/more" coupleId={coupleId} userId={userId} unreadCount={unreadCount} />
      <section className="ss-hero slim">
        <h1 className="ss-greet sm">
          Finance <em>hub</em>
        </h1>
        <p className="ss-sub">Money as teamwork. Log a contribution and watch the rings move.</p>
      </section>

      <div className="ss-grid">
        <section className="ss-card col-12">
          <div className="ss-kicker">Shared funds</div>
          {list.length === 0 ? (
            <p className="ss-muted" style={{ margin: 0 }}>
              No funds yet — add your first one below.
            </p>
          ) : (
            <div className="ss-funds">
              {list.map((f) => {
                const pct = Math.round((f.saved_cents / f.target_cents) * 100);
                return (
                  <div className="ss-fund" key={f.id}>
                    <Ring pct={pct} label={f.name} />
                    <div style={{ minWidth: 160 }}>
                      <b>{f.name}</b>
                      <span className="ss-muted">
                        {fmtR(f.saved_cents)} of {fmtR(f.target_cents)}
                      </span>
                    </div>
                    <ContributeForm fundId={f.id} fundName={f.name} />
                  </div>
                );
              })}
            </div>
          )}
          <CreateFundForm />
        </section>

        {closest && (
          <section className="ss-card col-12">
            <div className="ss-kicker">Companion suggestion</div>
            <p className="ss-muted" style={{ margin: 0 }}>
              {left <= 0
                ? `The ${closest.name} is complete — that's a milestone worth celebrating properly.`
                : `You're closest on the ${closest.name}: ${fmtR(left)} to go. Even R50 today keeps the momentum.`}
            </p>
          </section>
        )}
      </div>
    </>
  );
}
