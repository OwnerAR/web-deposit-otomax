import { NextRequest, NextResponse } from 'next/server';
import { CreateDepositRequest, CreateDepositResponse } from '@/types/deposit';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function POST(request: NextRequest) {
  try {
    // Logging (can be enabled via ENABLE_AUTH_LOGGING env var, or auto-enabled in development)
    const shouldLog = process.env.ENABLE_AUTH_LOGGING === 'true' || process.env.NODE_ENV !== 'production';
    
    if (shouldLog) {
      console.log('[API /deposit/create] ===== Request received =====');
      console.log('[API /deposit/create] All request headers:', Object.fromEntries(request.headers.entries()));
    }
    
    // Priority 1: Get Authorization header from custom header (forwarded by middleware)
    // Middleware sets x-auth-token header when forwarding to API routes
    let authHeader = request.headers.get('x-auth-token');
    
    if (shouldLog) {
      console.log('[API /deposit/create] x-auth-token header from middleware:', authHeader ? '✅ Present' : '❌ Not present');
      if (authHeader) {
        const maskedHeader = authHeader.length > 30 
          ? `${authHeader.substring(0, 30)}...` 
          : authHeader;
        console.log('[API /deposit/create] x-auth-token value:', maskedHeader);
      }
    }
    
    // Priority 2: Get Authorization header from request (if sent directly)
    if (!authHeader) {
      authHeader = request.headers.get('authorization');
      if (shouldLog) {
        console.log('[API /deposit/create] Authorization header from request:', authHeader ? '✅ Present' : '❌ Not present');
        if (authHeader) {
          const maskedHeader = authHeader.length > 30 
            ? `${authHeader.substring(0, 30)}...` 
            : authHeader;
          console.log('[API /deposit/create] Authorization header value:', maskedHeader);
        }
      }
    }
    
    // Priority 3: Get Authorization header from cookie (stored by middleware AS-IS)
    if (!authHeader) {
      const allCookies = request.cookies.getAll();
      if (shouldLog) {
        console.log('[API /deposit/create] All cookies:', allCookies.map(c => ({ name: c.name, hasValue: !!c.value })));
      }
      
      const authHeaderFromCookie = request.cookies.get('auth_token')?.value;
      if (authHeaderFromCookie) {
        // Use Authorization header from cookie AS-IS (no modification)
        authHeader = authHeaderFromCookie;
        if (shouldLog) {
          const maskedHeader = authHeaderFromCookie.length > 30 
            ? `${authHeaderFromCookie.substring(0, 30)}...` 
            : authHeaderFromCookie;
          console.log('[API /deposit/create] Authorization header from cookie (as-is):', maskedHeader);
        }
      } else {
        if (shouldLog) {
          console.log('[API /deposit/create] ❌ No Authorization header found in cookie');
        }
      }
    }
    
    // Get request body
    const body: CreateDepositRequest = await request.json();

    // Final Authorization header to send to backend
    const finalAuthHeader = authHeader;
    if (shouldLog) {
      console.log('[API /deposit/create] Final Authorization header to backend:', finalAuthHeader ? '✅ Will be sent' : '❌ Not sending');
      if (finalAuthHeader) {
        const maskedHeader = finalAuthHeader.length > 30 
          ? `${finalAuthHeader.substring(0, 30)}...` 
          : finalAuthHeader;
        console.log('[API /deposit/create] Final Authorization header value:', maskedHeader);
      }
      console.log('[API /deposit/create] Request body:', {
        amount: body.amount,
        payment_method: body.payment_method,
        phone_number: body.phone_number ? '***' : undefined,
      });
    }

    // Forward request to backend API with Authorization header
    const response = await fetch(`${API_BASE_URL}/api/deposit/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward Authorization header if present
        ...(finalAuthHeader && { Authorization: finalAuthHeader }),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'Failed to create deposit',
      }));
      
      return NextResponse.json(
        { error: error.error || 'Failed to create deposit' },
        { status: response.status }
      );
    }

    const data: CreateDepositResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating deposit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

