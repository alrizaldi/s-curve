import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next();

  try {
    // Create Supabase client with proper cookie handling for authentication
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            const allCookies = request.cookies.getAll();
            // console.log("[Middleware][Cookies] All cookies:", allCookies);
            return allCookies;
          },
          // Properly handle setting cookies to sync auth state
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Sanitize cookie name to ensure compatibility
              const sanitizedOptions = {
                ...options,
                httpOnly: options.httpOnly ?? true,
                secure: options.secure ?? process.env.NODE_ENV === "production",
                sameSite: options.sameSite ?? "lax",
                path: options.path ?? "/",
              };

              // Handle domain for cross-environment compatibility
              if (process.env.NODE_ENV === "production") {
                // In production, set domain for cross-subdomain compatibility
                sanitizedOptions.domain =
                  process.env.COOKIE_DOMAIN ?? ".yourdomain.com";
              }

              // Set the cookie with the correct options
              response.cookies.set(name, value, sanitizedOptions);
            });
          },
        },
      },
    );

    // Get the session with error handling
    let session = null;
    try {
      const {
        data: { session: fetchedSession },
      } = await supabase.auth.getSession();
      session = fetchedSession;

      // Additional debug: Check if there are auth cookies present
      const allCookies = request.cookies.getAll();
      const authCookies = allCookies.filter(
        (cookie) =>
          cookie.name.includes("sb-") && cookie.name.includes("-auth-token"),
      );
    } catch (error) {
      console.warn("[Middleware][SessionCheck] Error getting session:", error);
    }

    // Define protected routes
    const protectedPaths = [
      "/dashboard",
      "/projects",
      "/wbs",
      "/milestones",
      "/scurve",
    ];
    const isProtectedRoute = protectedPaths.some((path) =>
      request.nextUrl.pathname.startsWith(path),
    );
    const isPublicRoute = ["/auth/login", "/auth/signup"].some((path) =>
      request.nextUrl.pathname.startsWith(path),
    );

    // If accessing a protected route without a session, redirect to login
    if (isProtectedRoute && !session) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    // If accessing a public auth route but already logged in, redirect to dashboard
    if (isPublicRoute && session) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  } catch (error) {
    console.error("[Middleware][Error] Error in middleware:", error);
    // Return an error response if there's a critical error in middleware
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
      status: 500,
      statusText: "Internal Server Error",
    });
  }

  return response;
}

// Define which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
