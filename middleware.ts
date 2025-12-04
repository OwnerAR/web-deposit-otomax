import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware to capture Authorization header from Android WebView
 * and inject token to URL query parameter without redirect
 * 
 * Strategy: Token hanya dari URL query parameter (ONLY SOURCE)
 * - Middleware menangkap Authorization header dari Android WebView
 * - Set cookie dengan token untuk temporary storage
 * - Client-side script akan inject token ke URL query parameter tanpa reload
 * - Frontend membaca token dari query parameter saja
 */
export function middleware(request: NextRequest) {
  // Logging (can be enabled via ENABLE_AUTH_LOGGING env var, or auto-enabled in development)
  const shouldLog = process.env.ENABLE_AUTH_LOGGING === 'true' || process.env.NODE_ENV !== 'production';
  
  if (shouldLog) {
    console.log('[Middleware] Request URL:', request.url);
    console.log('[Middleware] Request path:', request.nextUrl.pathname);
  }
  
  // Check if Authorization header is present in current request (from Android WebView)
  const authHeader = request.headers.get('authorization');
  
  // Check if token already exists in query parameter
  const currentUrl = request.nextUrl.clone();
  const hasTokenParam = currentUrl.searchParams.has('token') || 
                        currentUrl.searchParams.has('auth_token') || 
                        currentUrl.searchParams.has('authToken');
  
  if (shouldLog) {
    console.log('[Middleware] Authorization header from request:', authHeader ? '✅ Present' : '❌ Not present');
    console.log('[Middleware] Token in query parameter:', hasTokenParam ? '✅ Present' : '❌ Not present');
    if (authHeader) {
      const maskedToken = authHeader.length > 20 
        ? `${authHeader.substring(0, 20)}...` 
        : authHeader;
      console.log('[Middleware] Authorization header value:', maskedToken);
    }
  }
  
  // Create response
  const response = NextResponse.next();
  
  // SOLUSI: Jika ada Authorization header dan belum ada token di query parameter
  // Set cookie dengan token untuk client-side script inject ke URL query parameter
  // Hanya untuk non-API routes
  if (authHeader && !hasTokenParam && !request.nextUrl.pathname.startsWith('/api/')) {
    // Set cookie dengan token (temporary storage untuk client-side inject)
    const tokenWithQuotes = `"${authHeader}"`;
    response.cookies.set('_auth_token_temp', tokenWithQuotes, {
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60, // 60 seconds - cukup untuk inject ke URL
      path: '/',
    });
    
    if (shouldLog) {
      const maskedHeader = authHeader.length > 20 
        ? `${authHeader.substring(0, 20)}...` 
        : authHeader;
      console.log('[Middleware] ✅ Set cookie with token (will be injected to URL by client-side script):', {
        pathname: request.nextUrl.pathname,
        tokenPreview: maskedHeader,
      });
    }
  }
  
  return response;
}

// Only run middleware on specific paths
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

