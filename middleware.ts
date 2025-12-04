import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware to capture Authorization header from Android WebView
 * and store it in a cookie for subsequent API requests
 */
export function middleware(request: NextRequest) {
  // Logging (can be enabled via ENABLE_AUTH_LOGGING env var, or auto-enabled in development)
  const shouldLog = process.env.ENABLE_AUTH_LOGGING === 'true' || process.env.NODE_ENV !== 'production';
  
  if (shouldLog) {
    console.log('[Middleware] Request URL:', request.url);
    console.log('[Middleware] Request path:', request.nextUrl.pathname);
  }
  
  // Priority 1: Check if Authorization header is present in current request (from Android WebView)
  let authHeader = request.headers.get('authorization');
  
  if (shouldLog) {
    console.log('[Middleware] Authorization header from request:', authHeader ? '✅ Present' : '❌ Not present');
    if (authHeader) {
      const maskedToken = authHeader.length > 20 
        ? `${authHeader.substring(0, 20)}...` 
        : authHeader;
      console.log('[Middleware] Authorization header value:', maskedToken);
    }
  }
  
  // Priority 2: If no Authorization header, try to get from cookie (from previous request)
  if (!authHeader) {
    const authHeaderFromCookie = request.cookies.get('auth_token')?.value;
    if (authHeaderFromCookie) {
      authHeader = authHeaderFromCookie;
      if (shouldLog) {
        const maskedHeader = authHeaderFromCookie.length > 20 
          ? `${authHeaderFromCookie.substring(0, 20)}...` 
          : authHeaderFromCookie;
        console.log('[Middleware] Authorization header from cookie:', maskedHeader);
      }
    } else {
      if (shouldLog) {
        console.log('[Middleware] No Authorization header in cookie');
      }
    }
  }
  
  // Create response
  const response = NextResponse.next();
  
  // If we have Authorization header (from request or cookie)
  if (authHeader) {
    // Store Authorization header AS-IS in httpOnly cookie (for future requests)
    if (shouldLog) {
      const maskedHeader = authHeader.length > 20 
        ? `${authHeader.substring(0, 20)}...` 
        : authHeader;
      console.log('[Middleware] Storing Authorization header in cookie (as-is):', maskedHeader);
    }
    
    // Set Authorization header AS-IS in httpOnly cookie
    response.cookies.set('auth_token', authHeader, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });
    
    // CRITICAL: Forward Authorization header to API routes via custom header
    // Next.js middleware cannot modify request headers, so we use a custom header
    // that the API route can read
    if (request.nextUrl.pathname.startsWith('/api/')) {
      // Set custom header that API route can read
      response.headers.set('x-auth-token', authHeader);
      
      if (shouldLog) {
        console.log('[Middleware] ✅ Authorization header forwarded to API route via x-auth-token header:', request.nextUrl.pathname);
      }
    }
  } else {
    if (shouldLog && request.nextUrl.pathname.startsWith('/api/')) {
      console.log('[Middleware] ⚠️ No Authorization header available for API route:', request.nextUrl.pathname);
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

