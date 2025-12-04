import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware to capture Authorization header from Android WebView
 * and redirect with token in query parameter
 * 
 * Strategy: Token hanya dari URL query parameter (ONLY SOURCE)
 * - Middleware menangkap Authorization header dari Android WebView
 * - Redirect ke URL yang sama dengan token di query parameter: ?authToken="ENC Key=..."
 * - Frontend membaca token dari query parameter saja
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
  
  // SOLUSI: Jika ada Authorization header dan belum ada token di query parameter, redirect dengan query parameter
  // Ini memastikan token langsung tersedia di URL sebagai query parameter (ONLY SOURCE)
  if (authHeader && !request.nextUrl.pathname.startsWith('/api/')) {
    const currentUrl = request.nextUrl.clone();
    const hasTokenParam = currentUrl.searchParams.has('token') || 
                          currentUrl.searchParams.has('auth_token') || 
                          currentUrl.searchParams.has('authToken');
    
    // Jika belum ada token di query parameter, redirect dengan query parameter
    if (!hasTokenParam) {
      // Set token dengan format: ?authToken="ENC Key=..."
      // searchParams.set() akan otomatis URL-encode
      const tokenWithQuotes = `"${authHeader}"`;
      currentUrl.searchParams.set('authToken', tokenWithQuotes);
      
      if (shouldLog) {
        const maskedHeader = authHeader.length > 20 
          ? `${authHeader.substring(0, 20)}...` 
          : authHeader;
        console.log('[Middleware] 🔄 Redirecting to URL with token query parameter:', {
          from: request.url,
          to: currentUrl.toString(),
          tokenPreview: maskedHeader,
        });
      }
      
      // Redirect ke URL yang sama dengan query parameter token
      return NextResponse.redirect(currentUrl);
    }
  }
  
  // Create response (untuk API routes atau jika token sudah ada di query parameter)
  const response = NextResponse.next();

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

