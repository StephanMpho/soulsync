import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CoupleContext = Awaited<ReturnType<typeof requireCoupleContext>>;

// Every room page needs the same three things: who's signed in, which
// couple they belong to, and who their partner is (if any — an inviter is
// "paired" the moment they send the invitation, before their partner
// accepts). Middleware already guarantees signed-in-and-paired for every
// route in the (paired) group, so the redirects here are a defensive
// fallback, not the primary guard.
export async function requireCoupleContext() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, couple_id, mood")
    .eq("id", user.id)
    .single()
    .overrideTypes<{ id: string; display_name: string; couple_id: string | null; mood: string | null }>();

  if (!profile?.couple_id) redirect("/invite");

  const { data: members } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("couple_id", profile.couple_id)
    .overrideTypes<{ id: string; display_name: string }[]>();

  const partner = members?.find((m) => m.id !== user.id) ?? null;

  // Unread = the partner's activity you haven't opened /alerts for yet.
  // Fetched here (not filtered server-side by seen_by) because PostgREST's
  // array-negation syntax for "not contains" is awkward; at two-person
  // volumes, pulling the small candidate set and filtering in JS is simpler
  // and just as fast.
  type ActivityRow = {
    id: string;
    actor_id: string;
    seen_by: string[];
    payload: { text: string };
    created_at: string;
  };

  const { data: activityData } = await supabase
    .from("activity")
    .select("id, actor_id, seen_by, payload, created_at")
    .eq("couple_id", profile.couple_id)
    .order("created_at", { ascending: false });

  const candidates = (activityData ?? []) as ActivityRow[];
  const myId: string = user.id;
  const unseenActivity = candidates.filter(
    (a) => a.actor_id !== myId && !a.seen_by?.includes(myId)
  );

  return {
    supabase,
    userId: user.id,
    displayName: profile.display_name,
    mood: profile.mood,
    coupleId: profile.couple_id,
    partner,
    unreadCount: unseenActivity.length,
    unseenActivity,
  };
}
