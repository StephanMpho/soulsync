import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Route guard (blueprint section 2): signed out -> /login; signed in
// without a couple -> the invitation flow; signed in with a couple -> the app.
const PUBLIC_PREFIXES = ["/login", "/auth", "/invite/"]; // note the trailing slash on /invite/

function isPublic(pathname: string) {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // /invite/[token] is the one page that must work for a signed-out visitor
  // reading her sealed letter, so it's public regardless of auth state.
  if (pathname.startsWith("/invite/")) {
    return response;
  }

  if (!user) {
    if (isPublic(pathname)) return response;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Signed in: figure out whether they're already part of a couple.
  const { data: profile } = await supabase
    .from("profiles")
    .select("couple_id")
    .eq("id", user.id)
    .single()
    .overrideTypes<{ couple_id: string | null }>();

  const paired = Boolean(profile?.couple_id);

  if (pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (!paired && pathname !== "/invite") {
    const url = request.nextUrl.clone();
    url.pathname = "/invite";
    return NextResponse.redirect(url);
  }

  if (paired && pathname === "/invite") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static, _next/image (Next.js internals)
     * - favicon, manifest, service worker, and icons (public/ PWA assets —
     *   sw.js and the icons were missing here before, which meant the
     *   browser's unauthenticated fetch for them got redirected to /login
     *   instead of the actual file, breaking install/registration)
     * - api/ — every route under app/api/ does its own auth (session-cookie
     *   checks, or the CRON_SECRET bearer-token check on the cron route).
     *   Without this exclusion, the cron route's Vercel-triggered request
     *   (no session cookie) was getting redirected to /login before its
     *   own handler ever ran.
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/|api/).*)",
  ],
};
