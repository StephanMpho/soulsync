import { requireCoupleContext } from "@/lib/session";
import { RoomHeader } from "../RoomHeader";
import { computeStreakState, type CompletionRow } from "@/lib/streak";

const MAX_FLOWERS_SHOWN = 200;

export default async function GardenPage() {
  const { supabase, coupleId, userId, partner, unreadCount } = await requireCoupleContext();

  const { data: rows } = partner
    ? await supabase
        .from("daily_completions")
        .select("date, user_id")
        .eq("couple_id", coupleId)
        .overrideTypes<CompletionRow[]>()
    : { data: null as CompletionRow[] | null };

  const state = partner ? computeStreakState(rows ?? [], userId, partner.id) : null;

  return (
    <>
      <RoomHeader
        title="Your garden"
        backHref="/"
        coupleId={coupleId}
        userId={userId}
        unreadCount={unreadCount}
        partnerId={partner?.id}
        partnerName={partner?.display_name}
      />
      <section className="ss-hero slim">
        <h1 className="ss-greet sm">
          One flower, <em>every day you showed up together</em>
        </h1>
        <p className="ss-sub">
          Complete the day&apos;s shared moment together to grow it — no scores, no judgment, just proof it&apos;s
          accumulating.
        </p>
      </section>

      {!partner ? (
        <div className="ss-card">
          <p className="ss-muted" style={{ margin: 0 }}>
            Your garden grows once you&apos;re paired.
          </p>
        </div>
      ) : (
        <>
          <div className="ss-days" style={{ marginBottom: 20 }}>
            <div>
              <div className="ss-stat-num">{state!.streak}</div>
              <div className="ss-stat-label">Day streak</div>
            </div>
            <div>
              <div className="ss-stat-num">{state!.gardenCount}</div>
              <div className="ss-stat-label">Flowers grown</div>
            </div>
          </div>

          {state!.gardenCount === 0 ? (
            <div className="ss-card">
              <p className="ss-muted" style={{ margin: 0 }}>
                No flowers yet — the first grows the day you both complete a shared moment on the Home page.
              </p>
            </div>
          ) : (
            <div className="ss-card ss-garden-grid">
              {Array.from({ length: Math.min(state!.gardenCount, MAX_FLOWERS_SHOWN) }).map((_, i) => (
                <span key={i} aria-hidden="true">
                  🌸
                </span>
              ))}
              {state!.gardenCount > MAX_FLOWERS_SHOWN && (
                <span className="ss-muted" style={{ fontSize: 13 }}>
                  +{state!.gardenCount - MAX_FLOWERS_SHOWN} more
                </span>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
