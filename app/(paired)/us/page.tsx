import { requireCoupleContext } from "@/lib/session";
import { RoomHeader } from "../RoomHeader";
import { DatesForm } from "./DatesForm";
import { PronounForm } from "./PronounForm";

type Couple = { met_date: string | null; anniversary: string | null };
type Invite = { answers: string[]; inviter_id: string | null };

export default async function UsPage() {
  const { supabase, coupleId, userId, displayName, partner, unreadCount } = await requireCoupleContext();

  const [{ data: couple }, { data: invitation }, { data: myProfile }] = await Promise.all([
    supabase
      .from("couples")
      .select("met_date, anniversary")
      .eq("id", coupleId)
      .single()
      .overrideTypes<Couple>(),
    supabase
      .from("invitations")
      .select("answers, inviter_id")
      .eq("couple_id", coupleId)
      .eq("status", "accepted")
      .maybeSingle()
      .overrideTypes<Invite | null>(),
    supabase
      .from("profiles")
      .select("pronoun")
      .eq("id", userId)
      .single()
      .overrideTypes<{ pronoun: string | null }>(),
  ]);

  const inviterName = invitation
    ? invitation.inviter_id === userId
      ? displayName
      : (partner?.display_name ?? "Your partner")
    : null;

  return (
    <>
      <RoomHeader
        title="Us"
        backHref="/more"
        coupleId={coupleId}
        userId={userId}
        unreadCount={unreadCount}
        partnerId={partner?.id}
        partnerName={partner?.display_name}
      />
      <section className="ss-hero slim">
        <h1 className="ss-greet sm">
          {displayName} & <em>{partner?.display_name ?? "your partner"}</em>
        </h1>
        <p className="ss-sub">Your story&apos;s important dates, and the keys to this home.</p>
      </section>

      <DatesForm metDate={couple?.met_date ?? null} anniversary={couple?.anniversary ?? null} />

      <div className="ss-grid" style={{ marginTop: 14 }}>
        <PronounForm displayName={displayName} pronoun={myProfile?.pronoun ?? null} />
      </div>

      {invitation && (
        <div className="ss-grid" style={{ marginTop: 14 }}>
          <section className="ss-card col-12">
            <div className="ss-kicker">The invitation that started it</div>
            <p className="ss-entry-text">&ldquo;{invitation.answers[0]}&rdquo;</p>
            <p className="ss-muted" style={{ marginTop: 8 }}>
              — {inviterName}, from the invitation letter
            </p>
          </section>
        </div>
      )}
    </>
  );
}
