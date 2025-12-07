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
    
    // Get request body
    const body: CreateDepositRequest = await request.json();
    
    if (shouldLog) {
      console.log('[API /deposit/create] Request body (before forwarding):', {
        amount: body.amount,
        payment_method: body.payment_method,
        phone_number: body.phone_number ? '***' : undefined,
        idagen: body.idagen || undefined,
      });
    }

    // Prepare body for backend - include idagen
    const backendBody: any = {
      amount: body.amount,
      payment_method: body.payment_method,
      ...(body.phone_number && { phone_number: body.phone_number }),
      ...(body.idagen && { idagen: body.idagen }),
    };

    // Forward request to backend API
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

