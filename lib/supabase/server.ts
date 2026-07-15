import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// For use in Server Components, Server Actions, and Route Handlers.
// Reads/writes the auth cookie set by middleware, scoped to the signed-in user.
//
// Not parameterized with a generated `Database` type: the version of
// @supabase/postgrest-js this project pulls in requires a fuller schema
// shape (Relationships, SetofOptions, etc.) than is worth hand-maintaining
// before the schema stabilizes. Query results are `any`; annotate the
// shape you expect at each call site with `.overrideTypes<T>()` instead.
// Swap in `supabase gen types typescript` output once the schema settles.
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — middleware already refreshes
            // the session cookie on every request, so this is safe to ignore.
          }
        },
      },
    }
  );
}
