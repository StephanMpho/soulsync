// Supabase errors (PostgrestError, AuthError) carry a `.message` string but
// aren't real `Error` instances, so `e instanceof Error` silently misses them
// and masks the actual database/auth error behind a generic fallback.
export function errorMessage(e: unknown, fallback: string): string {
  if (e && typeof e === "object" && "message" in e && typeof e.message === "string") {
    return e.message;
  }
  return fallback;
}
