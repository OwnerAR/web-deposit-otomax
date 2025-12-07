import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware to decode Authorization header from Android WebView
 * and redirect to /[paymentMethod]/[idagen] page after successful decode
 * 
 * Strategy:
 * - Middleware menangkap Authorization header dari Android WebView
 * - Redirect ke API route /api/auth/decode untuk decryption (karena middleware menggunakan Edge Runtime)
 * - API route akan handle decryption dan redirect ke final destination
 */
export async function middleware(request: NextRequest) {
  // Skip API routes and static files
  if (
    request.nextUrl.pathname.startsWith('/api/') || 
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.startsWith('/favicon.ico') ||
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname === '/success' ||
    request.nextUrl.pathname === '/not-found'
  ) {
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
    return NextResponse.next();
  }
  
  // Check if on payment method route without idagen (e.g., /vabank)
  // This is where we need to decode and redirect
  const isPaymentMethodRoute = paymentMethodRoutes.includes(firstSegment) && !secondSegment;
  
  if (!isPaymentMethodRoute) {
    return NextResponse.next();
  }
  
  // Check if Authorization header is present
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  
  if (!authHeader) {
    return NextResponse.redirect(new URL('/not-found', request.url));
  }
  
  // Extract key and signature from Authorization header
  // Format: ENC Key="...", Signature="..."
  const match = authHeader.match(/ENC Key="([^"]+)",\s*Signature="([^"]+)"/);
  
  if (!match || !match[1] || !match[2]) {
    return NextResponse.redirect(new URL('/not-found', request.url));
  }
  
  const key = match[1];
  const signature = match[2];
  
  // Redirect to API route for decoding
  // The API route will handle decryption and redirect to the final destination
  const decodeUrl = new URL('/api/auth/decode', request.url);
  decodeUrl.searchParams.set('key', key);
  decodeUrl.searchParams.set('signature', signature);
  decodeUrl.searchParams.set('paymentMethod', firstSegment);
  
  return NextResponse.redirect(decodeUrl);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
