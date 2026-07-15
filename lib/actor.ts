import { createClient } from "@/lib/supabase/server";

// Every server action starts the same way: who's calling, and which couple
// are they in. Centralized here instead of repeated in each actions.ts —
// returns null if either check fails, since a Server Action can't redirect
// like a page can; callers just bail out silently.
export async function getActor() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, couple_id")
    .eq("id", user.id)
    .single()
    .overrideTypes<{ display_name: string; couple_id: string | null }>();
  if (!profile?.couple_id) return null;

  return {
    supabase,
    userId: user.id,
    displayName: profile.display_name,
    coupleId: profile.couple_id,
  };
}
