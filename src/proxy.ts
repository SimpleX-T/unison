import { createClient } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // Refresh the session cookie and get the supabase client
  const { supabase, response } = createClient(request);

  // Read the (possibly refreshed) user — this is what actually sets the cookie
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname.startsWith("/auth");
  const isPublicRoute = pathname === "/" || pathname.startsWith("/api");
  const isProtectedRoute =
    pathname.startsWith("/workspace") || pathname.startsWith("/onboarding");

  // Not signed in → redirect protected routes to /auth
  if (!user && isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/auth";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Signed in → redirect /auth to workspace
  if (user && isAuthRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/workspace/select";
    return NextResponse.redirect(redirectUrl);
  }

  // Public routes and everything else: proceed with refreshed session response
  void isPublicRoute;
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
