import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware to decode Authorization header from Android WebView
 * and redirect to /[paymentMethod]/[idagen] page after successful decode
 * 
 * Strategy:
 * - Middleware menangkap Authorization header dari Android WebView
 * - Call API route /api/auth/decode untuk decode (karena middleware menggunakan Edge Runtime)
 * - Extract idagen dari hasil decode
 * - Redirect ke /[paymentMethod]/[idagen] page
 */
export async function middleware(request: NextRequest) {
  // Logging (can be enabled via ENABLE_AUTH_LOGGING env var, or auto-enabled in development)
  const shouldLog = process.env.ENABLE_AUTH_LOGGING === 'true' || process.env.NODE_ENV !== 'production';
  
  if (shouldLog) {
    console.log('[Middleware] Request URL:', request.url);
    console.log('[Middleware] Request path:', request.nextUrl.pathname);
  }
  
  // Skip API routes and static files
  if (request.nextUrl.pathname.startsWith('/api/') || 
      request.nextUrl.pathname.startsWith('/_next/') ||
      request.nextUrl.pathname.startsWith('/favicon.ico') ||
      request.nextUrl.pathname === '/' ||
      request.nextUrl.pathname === '/success' ||
      request.nextUrl.pathname === '/not-found') {
    return NextResponse.next();
  }
  
  // Payment method routes: vabank, ewallet, qris, retail
  const paymentMethodRoutes = ['vabank', 'ewallet', 'qris', 'retail'];
  const pathSegments = request.nextUrl.pathname.split('/').filter(Boolean);
  const firstSegment = pathSegments[0];
  const secondSegment = pathSegments[1];
  
  // Check if already on payment method with idagen page (e.g., /vabank/[idagen])
  // If yes, skip middleware (already decoded)
  if (paymentMethodRoutes.includes(firstSegment) && secondSegment) {
    // Already on /[paymentMethod]/[idagen] page, skip
    return NextResponse.next();
  }
  
  // Check if on payment method route without idagen (e.g., /vabank)
  // This is where we need to decode and redirect
  const isPaymentMethodRoute = paymentMethodRoutes.includes(firstSegment) && !secondSegment;
  
  if (!isPaymentMethodRoute) {
    // Not a payment method route, continue normally
    return NextResponse.next();
  }
  
  // Check if Authorization header is present in current request (from Android WebView)
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  
  if (shouldLog) {
    console.log('[Middleware] Authorization header from request:', authHeader ? '✅ Present' : '❌ Not present');
    if (authHeader) {
      const maskedToken = authHeader.length > 50 
        ? `${authHeader.substring(0, 50)}...` 
        : authHeader;
      console.log('[Middleware] Authorization header value:', maskedToken);
    }
  }
  
  // If no Authorization header and on payment method route, redirect to 404
  if (!authHeader) {
    if (shouldLog) {
      console.log('[Middleware] ❌ No Authorization header on payment method route, redirecting to 404');
    }
    const notFoundUrl = new URL('/not-found', request.url);
    return NextResponse.redirect(notFoundUrl);
  }
  
  // Extract key and signature from Authorization header
  // Format: ENC Key="...", Signature="..."
  const match = authHeader.match(/ENC Key="([^"]+)",\s*Signature="([^"]+)"/);
  
  if (!match || !match[1] || !match[2]) {
    if (shouldLog) {
      console.log('[Middleware] ❌ Failed to extract key and signature from Authorization header, redirecting to 404');
    }
    const notFoundUrl = new URL('/not-found', request.url);
    return NextResponse.redirect(notFoundUrl);
  }
  
  const key = match[1]; // This is the authkey
  const signature = match[2]; // This is the pesan (encrypted message)
  
  if (shouldLog) {
    console.log('[Middleware] Extracted key and signature from header');
  }
  
  // Redirect to API route for decoding (because middleware uses Edge Runtime which doesn't support Node.js crypto)
  // The API route will handle decryption and redirect to the final destination
  if (shouldLog) {
    console.log('[Middleware] Redirecting to /api/auth/decode for decryption...');
  }
  
  // Build decode URL with query parameters
  const decodeUrl = new URL('/api/auth/decode', request.url);
  decodeUrl.searchParams.set('key', key);
  decodeUrl.searchParams.set('signature', signature);
  decodeUrl.searchParams.set('paymentMethod', firstSegment);
  
  return NextResponse.redirect(decodeUrl);
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

