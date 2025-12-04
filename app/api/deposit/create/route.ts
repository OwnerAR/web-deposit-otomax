import { NextRequest, NextResponse } from 'next/server';
import { CreateDepositRequest, CreateDepositResponse } from '@/types/deposit';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function POST(request: NextRequest) {
  try {
    // Priority 1: Get Authorization header from current request (if sent directly)
    let authHeader = request.headers.get('authorization');
    
    // Priority 2: Get token from cookie (set by /api/auth/set-token endpoint)
    if (!authHeader) {
      const tokenFromCookie = request.cookies.get('auth_token')?.value;
      if (tokenFromCookie) {
        authHeader = `Bearer ${tokenFromCookie}`;
      }
    }
    
    // Get request body
    const body: CreateDepositRequest = await request.json();

    // Forward request to backend API with Authorization header
    const response = await fetch(`${API_BASE_URL}/api/deposit/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward Authorization header if present
        ...(authHeader && { Authorization: authHeader }),
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

