import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware to capture Authorization header from Android WebView
 * and store it in a cookie for subsequent API requests
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Check if Authorization header is present (from Android WebView)
  const authHeader = request.headers.get('authorization');
  
  if (authHeader) {
    // Extract token (handle both "Bearer token" and plain token)
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;
    
    // Set token in httpOnly cookie for security
    // This cookie will be available for all subsequent requests
    response.cookies.set('auth_token', token, {
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

