"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);

  const signOut = async () => {
    setBusy(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <button className="ss-back" style={{ margin: 0 }} onClick={signOut} disabled={busy}>
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
