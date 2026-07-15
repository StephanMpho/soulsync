import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AcceptInvite } from "./AcceptInvite";

export default async function InviteTokenPage({ params }: { params: { token: string } }) {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_invitation_by_token", {
    p_token: params.token,
  });
  const invitation = data?.[0];
  if (error || !invitation) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <AcceptInvite
      token={params.token}
      answers={invitation.answers}
      inviterName={invitation.inviter_name}
      status={invitation.status}
      signedIn={Boolean(user)}
    />
  );
}
