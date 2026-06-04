import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  console.log('[Middleware][RequestProcessing] Processing request for URL:', request.nextUrl.pathname);
  
  let response = NextResponse.next();
  
  try {
    // Create Supabase client with proper cookie handling for authentication
    console.log('[Middleware][SupabaseClient] Creating Supabase server client');
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            console.log('[Middleware][Cookies] Getting all cookies from request');
            const allCookies = request.cookies.getAll();
            console.log('[Middleware][Cookies] All cookies:', allCookies);
            return allCookies;
          },
          // Properly handle setting cookies to sync auth state
          setAll(cookiesToSet) {
            console.log('[Middleware][Cookies] Setting cookies:', cookiesToSet.length);
            cookiesToSet.forEach(({ name, value, options }) => {
              console.log('[Middleware][CookieSet]', name, 'options:', options);
              
              // Sanitize cookie name to ensure compatibility
              const sanitizedOptions = {
                ...options,
                httpOnly: options.httpOnly ?? true,
                secure: options.secure ?? process.env.NODE_ENV === 'production',
                sameSite: options.sameSite ?? 'lax',
                path: options.path ?? '/',
              };
              
              // Handle domain for cross-environment compatibility
              if (process.env.NODE_ENV === 'production') {
                // In production, set domain for cross-subdomain compatibility
                sanitizedOptions.domain = process.env.COOKIE_DOMAIN ?? '.yourdomain.com';
              }
              
              // Set the cookie with the correct options
              response.cookies.set(name, value, sanitizedOptions);
            });
          },
        },
      }
    );

    // Get the session with error handling
    let session = null;
    try {
      console.log('[Middleware][SessionCheck] Attempting to get session');
      const { data: { session: fetchedSession } } = await supabase.auth.getSession();
      session = fetchedSession;
      console.log('[Middleware][SessionCheck] Session check complete, session exists:', !!session, 'user ID:', session?.user?.id);
      
      // Additional debug: Check if there are auth cookies present
      const allCookies = request.cookies.getAll();
      const authCookies = allCookies.filter(cookie => 
        cookie.name.includes('sb-') && cookie.name.includes('-auth-token')
      );
      console.log('[Middleware][AuthDebug] Total cookies:', allCookies.length);
      console.log('[Middleware][AuthDebug] Found auth-related cookies:', authCookies.length, 'details:', authCookies);
      
      // Log all cookie names for debugging
      console.log('[Middleware][AuthDebug] All cookie names:', allCookies.map(c => c.name));
    } catch (error) {
      console.warn('[Middleware][SessionCheck] Error getting session:', error);
    }

    // Define protected routes
    const protectedPaths = ['/dashboard', '/projects', '/wbs', '/milestones', '/scurve'];
    const isProtectedRoute = protectedPaths.some(path => 
      request.nextUrl.pathname.startsWith(path)
    );
    const isPublicRoute = ['/auth/login', '/auth/signup'].some(path =>
      request.nextUrl.pathname.startsWith(path)
    );

    console.log('[Middleware][RouteInfo] Path:', request.nextUrl.pathname, 
                'Is protected:', isProtectedRoute, 
                'Is public auth:', isPublicRoute, 
                'Has session:', !!session);

    // If accessing a protected route without a session, redirect to login
    if (isProtectedRoute && !session) {
      console.log('[Middleware][Redirect] Redirecting to login - protected route accessed without session');
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // If accessing a public auth route but already logged in, redirect to dashboard
    if (isPublicRoute && session) {
      console.log('[Middleware][Redirect] Redirecting to dashboard - public auth route accessed while logged in');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } catch (error) {
    console.error('[Middleware][Error] Error in middleware:', error);
    // Return an error response if there's a critical error in middleware
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
      status: 500,
      statusText: 'Internal Server Error',
    });
  }

  console.log('[Middleware][Response] Request processed, returning response');
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
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};