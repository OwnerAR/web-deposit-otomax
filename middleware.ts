import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware to capture Authorization header from Android WebView
 * and store it in a cookie for subsequent API requests
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Check if Authorization header is present (from Android WebView)
  const authHeader = request.headers.get('authorization');
  
  // Logging (can be enabled via ENABLE_AUTH_LOGGING env var, or auto-enabled in development)
  const shouldLog = process.env.ENABLE_AUTH_LOGGING === 'true' || process.env.NODE_ENV !== 'production';
  
  if (shouldLog) {
    console.log('[Middleware] Request URL:', request.url);
    console.log('[Middleware] Authorization header received:', authHeader ? '✅ Present' : '❌ Not present');
    if (authHeader) {
      // Mask token for security (show first 20 chars only)
      const maskedToken = authHeader.length > 20 
        ? `${authHeader.substring(0, 20)}...` 
        : authHeader;
      console.log('[Middleware] Authorization header value:', maskedToken);
    }
  }
  
  if (authHeader) {
    // Store Authorization header AS-IS (don't modify anything)
    // This ensures the exact format received is preserved and sent to backend
    if (shouldLog) {
      const maskedHeader = authHeader.length > 20 
        ? `${authHeader.substring(0, 20)}...` 
        : authHeader;
      console.log('[Middleware] Authorization header stored in cookie (as-is):', maskedHeader);
    }
    
    // Set Authorization header AS-IS in httpOnly cookie
    // This cookie will be available for all subsequent requests
    response.cookies.set('auth_token', authHeader, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });
  }

  return response;
}

// Only run middleware on specific paths
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

