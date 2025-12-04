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
    
    // Priority 1: Get Authorization header from request (sent by client-side fetch)
    // This is the PRIMARY method - client-side sends Authorization header directly
    let authHeader = request.headers.get('authorization');
    
    if (shouldLog) {
      console.log('[API /deposit/create] Authorization header from request (client-side):', authHeader ? '✅ Present' : '❌ Not present');
      if (authHeader) {
        const maskedHeader = authHeader.length > 30 
          ? `${authHeader.substring(0, 30)}...` 
          : authHeader;
        console.log('[API /deposit/create] Authorization header value:', maskedHeader);
      }
    }
    
    // Priority 2: Get Authorization header from cookie (stored by middleware - fallback)
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
          console.log('[API /deposit/create] Authorization header from cookie (fallback, as-is):', maskedHeader);
        }
      } else {
        if (shouldLog) {
          console.log('[API /deposit/create] ❌ No Authorization header found in cookie');
        }
      }
    }
    
    // Get request body
    const body: CreateDepositRequest = await request.json();

    // Extract token from body (injected by client-side)
    // Priority: body.auth_token > Authorization header > cookie
    let finalAuthToken = body.auth_token;
    
    if (!finalAuthToken && authHeader) {
      // Fallback to Authorization header if not in body
      finalAuthToken = authHeader;
    }
    
    if (shouldLog) {
      console.log('[API /deposit/create] Token from body:', body.auth_token ? '✅ Present' : '❌ Not present');
      console.log('[API /deposit/create] Token from header:', authHeader ? '✅ Present' : '❌ Not present');
      console.log('[API /deposit/create] Final token to backend:', finalAuthToken ? '✅ Will be sent' : '❌ Not sending');
      if (finalAuthToken) {
        const maskedToken = finalAuthToken.length > 30 
          ? `${finalAuthToken.substring(0, 30)}...` 
          : finalAuthToken;
        console.log('[API /deposit/create] Final token value:', maskedToken);
      }
      console.log('[API /deposit/create] Request body (before forwarding):', {
        amount: body.amount,
        payment_method: body.payment_method,
        phone_number: body.phone_number ? '***' : undefined,
        auth_token: body.auth_token ? '*** (will be forwarded)' : undefined,
      });
    }

    // Prepare body for backend - keep auth_token in body
    // Remove auth_token from body if we're using Authorization header instead
    const backendBody: any = {
      amount: body.amount,
      payment_method: body.payment_method,
      ...(body.phone_number && { phone_number: body.phone_number }),
      // Keep auth_token in body if present (backend expects it in body)
      ...(finalAuthToken && { auth_token: finalAuthToken }),
    };

    // Forward request to backend API
    // Token is sent in body, not in Authorization header
    const response = await fetch(`${API_BASE_URL}/api/deposit/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Also send Authorization header as fallback (if backend supports both)
        ...(finalAuthToken && !body.auth_token && { Authorization: finalAuthToken }),
      },
      body: JSON.stringify(backendBody),
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

