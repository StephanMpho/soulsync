import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notifyPartner } from "@/lib/notify";

// Same restraint-rule dispatch every mutation's server action already calls
// directly — exposed as its own route per the blueprint's route list, for
// any future client that fires an activity outside this app's own actions.
export async function POST(request: Request) {
  const { type, title, body, url } = await request.json();
  if (typeof type !== "string" || typeof title !== "string" || typeof body !== "string") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

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

  await notifyPartner(supabase, profile.couple_id, user.id, type, { title, body, url });
  return NextResponse.json({ ok: true });
}
