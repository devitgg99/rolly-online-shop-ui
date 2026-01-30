import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * Middleware to protect routes and handle authentication
 * 
 * This runs BEFORE every request to check if user is authenticated
 */
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Redirect authenticated users away from auth pages (optional but nice UX)
    if (token && (path.startsWith("/login") || path.startsWith("/register"))) {
      if (token.role === "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      } else {
        return NextResponse.redirect(new URL("/profile", req.url));
      }
    }

    // Role-based access control for admin routes
    if (
      path.startsWith("/dashboard") ||
      path.startsWith("/products") ||
      path.startsWith("/categories") ||
      path.startsWith("/brands") ||
      path.startsWith("/orders") ||
      path.startsWith("/settings")
    ) {
      if (token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    // Protect user routes
    if (
      path.startsWith("/profile") ||
      path.startsWith("/my-orders") ||
      path.startsWith("/wishlist")
    ) {
      if (!token) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    // Create response with security headers
    const response = NextResponse.next();
    
    // Security headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()'
    );

    return response;
  },
  {
    callbacks: {
      /**
       * This runs FIRST to determine if middleware should run
       * Return true = run middleware
       * Return false = skip middleware
       */
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Public paths - always allow
        if (
          path.startsWith("/login") ||
          path.startsWith("/register") ||
          path === "/"
        ) {
          return true;
        }

        // Protected paths - require authentication
        if (
          path.startsWith("/user") ||
          path.startsWith("/admin") ||
          path.startsWith("/profile") ||
          path.startsWith("/my-orders") ||
          path.startsWith("/wishlist") ||
          path.startsWith("/orders")
        ) {
          return !!token; // Only allow if token exists
        }

        // Default: allow
        return true;
      },
    },
    pages: {
      signIn: "/login", // Redirect here if not authenticated
    },
  }
);

/**
 * Matcher configuration
 * Specify which routes this middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder
     * - api routes (handled separately)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api/auth).*)",
  ],
};
