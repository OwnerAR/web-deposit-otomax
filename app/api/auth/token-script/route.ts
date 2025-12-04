import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint that returns a script tag with auth token
 * This allows client-side to read token from a script tag
 */
export async function GET(request: NextRequest) {
  const shouldLog = process.env.ENABLE_AUTH_LOGGING === 'true' || process.env.NODE_ENV !== 'production';
  
  // Get token from cookie (stored by middleware)
  const authToken = request.cookies.get('auth_token')?.value || 
                    request.cookies.get('auth_token_client')?.value;
  
  if (shouldLog) {
    console.log('[API /auth/token-script] Token from cookie:', authToken ? '✅ Present' : '❌ Not present');
  }
  
  if (authToken) {
    // Return JavaScript that sets token in sessionStorage
    const script = `
      (function() {
        if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
          try {
            sessionStorage.setItem('auth_token', ${JSON.stringify(authToken)});
            console.log('[TokenScript] Token stored in sessionStorage');
          } catch (e) {
            console.error('[TokenScript] Error storing token:', e);
          }
        }
      })();
    `;
    
    return new NextResponse(script, {
      headers: {
        'Content-Type': 'application/javascript',
      },
    });
  }
  
  // Return empty script if no token
  return new NextResponse('', {
    headers: {
      'Content-Type': 'application/javascript',
    },
  });
}

