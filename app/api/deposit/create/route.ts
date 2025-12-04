import { NextRequest, NextResponse } from 'next/server';
import { CreateDepositRequest, CreateDepositResponse } from '@/types/deposit';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function POST(request: NextRequest) {
  try {
    // Logging (can be enabled via ENABLE_AUTH_LOGGING env var, or auto-enabled in development)
    const shouldLog = process.env.ENABLE_AUTH_LOGGING === 'true' || process.env.NODE_ENV !== 'production';
    
    if (shouldLog) {
      console.log('[API /deposit/create] ===== Request received =====');
    }
    
    // Get request body - token hanya dari body.auth_token (injected by DepositForm)
    const body: CreateDepositRequest = await request.json();
    
    // Extract token from body (ONLY SOURCE - injected by DepositForm from query parameter)
    const authToken = body.auth_token;
    
    if (shouldLog) {
      console.log('[API /deposit/create] Token from body:', authToken ? '✅ Present' : '❌ Not present');
      if (authToken) {
        const maskedToken = authToken.length > 30 
          ? `${authToken.substring(0, 30)}...` 
          : authToken;
        console.log('[API /deposit/create] Token value:', maskedToken);
      }
      console.log('[API /deposit/create] Request body (before forwarding):', {
        amount: body.amount,
        payment_method: body.payment_method,
        phone_number: body.phone_number ? '***' : undefined,
        auth_token: body.auth_token ? '*** (will be forwarded)' : undefined,
      });
    }

    // Prepare body for backend - token hanya dari body.auth_token
    const backendBody: any = {
      amount: body.amount,
      payment_method: body.payment_method,
      ...(body.phone_number && { phone_number: body.phone_number }),
      // Token hanya dari body.auth_token (injected by DepositForm)
      ...(authToken && { auth_token: authToken }),
    };

    // Forward request to backend API
    // Token is sent in body as auth_token
    const response = await fetch(`${API_BASE_URL}/api/deposit/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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

