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
  
  // SOLUSI: Jika ada Authorization header dan belum ada token di query parameter, redirect dengan query parameter
  // Ini memastikan token langsung tersedia di URL sebagai query parameter
  if (authHeader && !request.nextUrl.pathname.startsWith('/api/')) {
    const currentUrl = request.nextUrl.clone();
    const hasTokenParam = currentUrl.searchParams.has('token') || 
                          currentUrl.searchParams.has('auth_token') || 
                          currentUrl.searchParams.has('authToken');
    
    // Jika belum ada token di query parameter, redirect dengan query parameter
    if (!hasTokenParam) {
      // Format token dengan quotes: "ENC Key=..."
      // Sesuai format yang diinginkan: ?authToken="ENC Key=..."
      const tokenWithQuotes = `"${authHeader}"`;
      // URL encode untuk safety
      const encodedToken = encodeURIComponent(tokenWithQuotes);
      
      // Tambahkan token ke query parameter dengan format: authToken="ENC Key=..."
      currentUrl.searchParams.set('authToken', encodedToken);
      
      if (shouldLog) {
        const maskedHeader = authHeader.length > 20 
          ? `${authHeader.substring(0, 20)}...` 
          : authHeader;
        console.log('[Middleware] 🔄 Redirecting to URL with token query parameter:', {
          from: request.url,
          to: currentUrl.toString(),
          tokenPreview: maskedHeader,
          format: 'authToken="ENC Key=..."',
        });
      }
      
      // Redirect ke URL yang sama dengan query parameter token
      return NextResponse.redirect(currentUrl);
    }
  }
  
  // Create response
  const response = NextResponse.next();
  
  // If we have Authorization header (from request or cookie)
  if (authHeader) {
    // Store Authorization header AS-IS in httpOnly cookie (for fallback)
    if (shouldLog) {
      const maskedHeader = authHeader.length > 20 
        ? `${authHeader.substring(0, 20)}...` 
        : authHeader;
      console.log('[Middleware] Storing Authorization header in cookie (as-is):', maskedHeader);
    }
    
    // Cookie settings yang optimal untuk Android WebView:
    // - httpOnly: true untuk keamanan (server-side only)
    // - secure: true untuk HTTPS (WAJIB di production, WebView support)
    // - sameSite: 'lax' (lebih kompatibel dengan WebView daripada 'strict')
    // - path: '/' untuk semua routes
    // - maxAge: 24 jam untuk session persistence
    
    // HttpOnly cookie untuk server-side access (lebih secure)
    response.cookies.set('auth_token', authHeader, {
      httpOnly: true,        // ✅ Server-side only (secure)
      secure: process.env.NODE_ENV === 'production', // ✅ HTTPS only in production (WebView requires this)
      sameSite: 'lax',       // ✅ Lax lebih kompatibel dengan WebView (strict bisa bermasalah)
      maxAge: 60 * 60 * 24,  // ✅ 24 hours
      path: '/',             // ✅ Root path (semua routes bisa akses)
    });
    
    // Non-httpOnly cookie untuk client-side JavaScript access
    // IMPORTANT: Cookie ini diperlukan karena httpOnly tidak bisa dibaca JavaScript
    // WebView CookieManager akan menyimpan kedua cookie ini
    response.cookies.set('auth_token_client', authHeader, {
      httpOnly: false,       // ✅ Allow client-side JavaScript to read
      secure: process.env.NODE_ENV === 'production', // ✅ HTTPS only in production
      sameSite: 'lax',       // ✅ Lax untuk WebView compatibility
      maxAge: 60 * 60 * 24,  // ✅ 24 hours
      path: '/',             // ✅ Root path
    });
    
    // CRITICAL: Expose token in response header for client-side to read
    // This works even if cookies don't work in WebView
    // Client-side can read this header and store in sessionStorage
    if (!request.nextUrl.pathname.startsWith('/api/')) {
      // Only expose to non-API routes (for security)
      response.headers.set('x-auth-token', authHeader);
      
      if (shouldLog) {
        console.log('[Middleware] ✅ Authorization header exposed in x-auth-token header for client-side');
        console.log('[Middleware] ✅ Authorization header also stored in non-httpOnly cookie (auth_token_client)');
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

