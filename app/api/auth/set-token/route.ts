import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint untuk menyimpan auth token dari Authorization header
 * Dipanggil saat initial page load jika Android WebView mengirim Authorization header
 */
export async function POST(request: NextRequest) {
  try {
    // Get Authorization header from request (sent by Android WebView)
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header not found' },
        { status: 400 }
      );
    }

    // Set token in httpOnly cookie for security
    // Token akan digunakan oleh API route saat forward ke backend
    const response = NextResponse.json({ success: true });
    
    // Extract token (handle both "Bearer token" and plain token)
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;
    
    // Set httpOnly cookie (secure, httpOnly, sameSite)
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error setting auth token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

