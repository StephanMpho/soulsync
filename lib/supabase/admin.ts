import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS entirely. Server-only, and only ever
// imported by the cron route: every other part of the app deliberately
// stays on the per-user auth pattern (lib/supabase/server.ts) so a single
// request can never see data outside its own couple. The cron job is the
// one legitimate exception — it has no "current user" and must read/write
// across every couple.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
