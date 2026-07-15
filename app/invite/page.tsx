import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InviteJourney } from "./InviteJourney";

// Middleware already guarantees "signed in, not yet paired" for this route —
// this just supplies the inviter's real name so the letter preview and
// signature aren't hardcoded to the prototype's demo couple.
export default async function InvitePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  return <InviteJourney inviterName={profile?.display_name ?? "You"} />;
}
