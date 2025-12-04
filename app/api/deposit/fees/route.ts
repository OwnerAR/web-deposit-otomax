import { NextRequest, NextResponse } from 'next/server';
import { FeesResponse } from '@/types/fees';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function GET(request: NextRequest) {
  try {
    // Forward request to backend API
    const response = await fetch(`${API_BASE_URL}/api/deposit/fees`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'Failed to get fee configuration',
      }));
      
      return NextResponse.json(
        { error: error.error || 'Failed to get fee configuration' },
        { status: response.status }
      );
    }

    const data: FeesResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error getting fee configuration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

