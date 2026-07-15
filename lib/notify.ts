import type { SupabaseClient } from "@supabase/supabase-js";
import { sendPushToUser, type PushPayload } from "@/lib/push";

// Restraint rules from the blueprint (section 5): love notes and capsule
// unlocks push immediately; memories/journal/goals batch into at most one
// push per hour; moods and habit ticks never push. Fund contributions and
// sealing a capsule aren't called out in the spec either way — treated as
// "none" (in-app feed only) rather than guessed into a category.
type Restraint = "immediate" | "batched" | "none";

const RESTRAINT: Record<string, Restraint> = {
  note: "immediate",
  capsule_opened: "immediate",
  memory: "batched",
  journal: "batched",
  goal: "batched",
  habit: "none",
  mood: "none",
  fund: "none",
  capsule_sealed: "none",
};

// Every batched type (memory/journal/goal) shares one hourly window per
// couple — "Konanani added 3 things to your home" is one notification, not
// three, per the blueprint's own example.
const BATCH_CATEGORY = "batched";

export async function notifyPartner(
  supabase: SupabaseClient,
  coupleId: string,
  actorId: string,
  type: string,
  payload: PushPayload
) {
  const restraint = RESTRAINT[type] ?? "none";
  if (restraint === "none") return;

  if (restraint === "batched") {
    const { data: shouldSend } = await supabase.rpc("should_notify_batched", {
      p_category: BATCH_CATEGORY,
    });
    if (!shouldSend) return;
  }

  const { data: members } = await supabase
    .from("profiles")
    .select("id")
    .eq("couple_id", coupleId)
    .overrideTypes<{ id: string }[]>();

  const partner = (members ?? []).find((m) => m.id !== actorId);
  if (!partner) return;

  await sendPushToUser(supabase, partner.id, payload);
}
