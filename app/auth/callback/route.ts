import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Supabase redirects here after a magic-link click or email confirmation,
// with a `code` to exchange for a real session cookie.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Lets the invite-acceptance flow send a confirming user back to the same
  // /invite/[token] page instead of landing on the generic guard redirect.
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
