import type { SupabaseClient } from "@supabase/supabase-js";

// Every mutation in the app writes its row, then a matching activity row —
// same event model as the prototype's withActivity() helper. seen_by starts
// with the actor already in it (they don't need to be notified of their
// own action), so only the partner's unread count moves.
export async function logActivity(
  supabase: SupabaseClient,
  coupleId: string,
  actorId: string,
  type: string,
  text: string
) {
  await supabase.from("activity").insert({
    couple_id: coupleId,
    actor_id: actorId,
    type,
    payload: { text },
    seen_by: [actorId],
  });
}
