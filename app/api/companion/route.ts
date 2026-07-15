import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCompanionInsight } from "@/lib/companion";

// Thin wrapper around the same function Home calls directly server-side —
// exists as its own endpoint per the blueprint's route list, for any future
// client (mobile app, etc.) that needs the insight without rendering Home.
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("couple_id")
    .eq("id", user.id)
    .single()
    .overrideTypes<{ couple_id: string | null }>();
  if (!profile?.couple_id) return NextResponse.json({ error: "Not paired" }, { status: 400 });

  const insight = await getCompanionInsight(supabase, profile.couple_id);
  return NextResponse.json({ insight });
}
