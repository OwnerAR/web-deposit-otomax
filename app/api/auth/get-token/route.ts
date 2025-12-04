import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint to get Authorization token from cookie
 * This allows client-side to fetch the token that was stored by middleware
 */
export async function GET(request: NextRequest) {
  const shouldLog = process.env.ENABLE_AUTH_LOGGING === 'true' || process.env.NODE_ENV !== 'production';
  
  // Get token from cookie (stored by middleware)
  const authToken = request.cookies.get('auth_token')?.value;
  
  if (shouldLog) {
    console.log('[API /auth/get-token] Token from cookie:', authToken ? '✅ Present' : '❌ Not present');
    if (authToken) {
      const maskedToken = authToken.length > 20 
        ? `${authToken.substring(0, 20)}...` 
        : authToken;
      console.log('[API /auth/get-token] Token value:', maskedToken);
    }
  }
  
  if (authToken) {
    return NextResponse.json({ token: authToken });
  }
  
  return NextResponse.json({ token: null }, { status: 404 });
}

