import { NextRequest, NextResponse } from 'next/server';
import { decrypt, extractIdAgen } from '@/lib/decrypt';

/**
 * Middleware to decode Authorization header from Android WebView
 * and redirect to /[idagen] page after successful decode
 * 
 * Strategy:
 * - Middleware menangkap Authorization header dari Android WebView
 * - Decode header menggunakan decrypt function
 * - Extract idagen dari hasil decode
 * - Redirect ke /[idagen] page
 */
export function middleware(request: NextRequest) {
  // Logging (can be enabled via ENABLE_AUTH_LOGGING env var, or auto-enabled in development)
  const shouldLog = process.env.ENABLE_AUTH_LOGGING === 'true' || process.env.NODE_ENV !== 'production';
  
  if (shouldLog) {
    console.log('[Middleware] Request URL:', request.url);
    console.log('[Middleware] Request path:', request.nextUrl.pathname);
  }
  
  // Skip API routes and static files
  if (request.nextUrl.pathname.startsWith('/api/') || 
      request.nextUrl.pathname.startsWith('/_next/') ||
      request.nextUrl.pathname.startsWith('/favicon.ico')) {
    return NextResponse.next();
  }
  
  // Check if already on idagen page (avoid redirect loop)
  const pathSegments = request.nextUrl.pathname.split('/').filter(Boolean);
  if (pathSegments.length === 1 && pathSegments[0] !== '') {
    // Already on /[idagen] page, skip
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
  
  // If no Authorization header, continue normally
  if (!authHeader) {
    return NextResponse.next();
  }
  
  // Extract key and signature from Authorization header
  // Format: ENC Key="...", Signature="..."
  const match = authHeader.match(/ENC Key="([^"]+)",\s*Signature="([^"]+)"/);
  
  if (!match || !match[1] || !match[2]) {
    if (shouldLog) {
      console.log('[Middleware] ❌ Failed to extract key and signature from Authorization header');
    }
    return NextResponse.next();
  }
  
  const key = match[1]; // This is the authkey
  const signature = match[2]; // This is the pesan (encrypted message)
  
  if (shouldLog) {
    console.log('[Middleware] Extracted key and signature from header');
  }
  
  // Get environment variable for private key
  const privateKey = process.env.DECRYPT_PRIVATE_KEY;
  
  if (!privateKey) {
    console.error('[Middleware] ❌ Missing DECRYPT_PRIVATE_KEY environment variable');
    return NextResponse.next();
  }
  
  // Decrypt the signature using key as authkey
  if (shouldLog) {
    console.log('[Middleware] Attempting to decode signature...');
  }
  
  const decryptedData = decrypt(signature, privateKey, key);
  
  if (!decryptedData) {
    if (shouldLog) {
      console.log('[Middleware] ❌ Decryption failed');
    }
    return NextResponse.next();
  }
  
  // Extract idagen from decrypted JSON data
  const idagen = extractIdAgen(decryptedData);
  
  if (!idagen) {
    if (shouldLog) {
      console.log('[Middleware] ❌ Failed to extract idagen from decrypted data');
      console.log('[Middleware] Decrypted data:', decryptedData);
    }
    return NextResponse.next();
  }
  
  if (shouldLog) {
    console.log('[Middleware] ✅ Successfully decoded, idagen:', idagen);
    console.log('[Middleware] 🔄 Redirecting to /' + idagen);
  }
  
  // Redirect to /[idagen] page
  const redirectUrl = new URL(`/${idagen}`, request.url);
  return NextResponse.redirect(redirectUrl);
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

