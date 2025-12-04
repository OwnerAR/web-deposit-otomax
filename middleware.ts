import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware to capture Authorization header from Android WebView
 * and store it in a cookie for subsequent API requests
 */
export function middleware(request: NextRequest) {
  // Check if Authorization header is present (from Android WebView)
  const authHeader = request.headers.get('authorization');
  
  // Logging (can be enabled via ENABLE_AUTH_LOGGING env var, or auto-enabled in development)
  const shouldLog = process.env.ENABLE_AUTH_LOGGING === 'true' || process.env.NODE_ENV !== 'production';
  
  if (shouldLog) {
    console.log('[Middleware] Request URL:', request.url);
    console.log('[Middleware] Request path:', request.nextUrl.pathname);
    console.log('[Middleware] Authorization header received:', authHeader ? '✅ Present' : '❌ Not present');
    if (authHeader) {
      // Mask token for security (show first 20 chars only)
      const maskedToken = authHeader.length > 20 
        ? `${authHeader.substring(0, 20)}...` 
        : authHeader;
      console.log('[Middleware] Authorization header value:', maskedToken);
    }
  }
  
  // Create response
  const response = NextResponse.next();
  
  if (authHeader) {
    // Store Authorization header AS-IS in httpOnly cookie (for fallback)
    if (shouldLog) {
      const maskedHeader = authHeader.length > 20 
        ? `${authHeader.substring(0, 20)}...` 
        : authHeader;
      console.log('[Middleware] Authorization header stored in cookie (as-is):', maskedHeader);
    }
    
    // Set Authorization header AS-IS in httpOnly cookie
    response.cookies.set('auth_token', authHeader, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });
    
    // CRITICAL: Forward Authorization header directly to API routes
    // This ensures the header is available even if cookies don't work
    if (request.nextUrl.pathname.startsWith('/api/')) {
      response.headers.set('authorization', authHeader);
      if (shouldLog) {
        console.log('[Middleware] Authorization header forwarded to API route:', request.nextUrl.pathname);
      }
    }
  }

  return response;
}

// Only run middleware on specific paths
// IMPORTANT: Include /api/* paths so middleware can forward Authorization header to API routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * 
     * Note: We include /api/* paths so middleware can forward Authorization header
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

