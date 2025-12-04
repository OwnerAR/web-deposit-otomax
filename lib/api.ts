import { CreateDepositRequest, CreateDepositResponse } from '@/types/deposit';
import { ApiError } from '@/types/api';
import { FeesResponse } from '@/types/fees';
import { getAuthToken } from './auth';

// Use Next.js API route as proxy to handle Authorization header
const API_ROUTE = '/api/deposit/create';
const FEES_ROUTE = '/api/deposit/fees';

export const apiClient = {
  async createDeposit(data: CreateDepositRequest): Promise<CreateDepositResponse> {
    // Logging (can be enabled via ENABLE_AUTH_LOGGING env var, or auto-enabled in development)
    const shouldLog = process.env.NEXT_PUBLIC_ENABLE_AUTH_LOGGING === 'true' || process.env.NODE_ENV !== 'production';
    
    // Get auth token (from URL param, sessionStorage, or postMessage)
    const authToken = getAuthToken();
    
    if (shouldLog) {
      console.log('[API Client] Creating deposit request...');
      console.log('[API Client] Auth token available:', authToken ? '✅ Yes' : '❌ No');
      if (authToken) {
        const maskedToken = authToken.length > 20 
          ? `${authToken.substring(0, 20)}...` 
          : authToken;
        console.log('[API Client] Auth token value:', maskedToken);
      }
      console.log('[API Client] Request data:', {
        amount: data.amount,
        payment_method: data.payment_method,
        phone_number: data.phone_number ? '***' : undefined,
      });
    }
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add Authorization header if token is available
    // IMPORTANT: Send token AS-IS (don't add "Bearer" prefix if it's already there)
    // Middleware stores the exact format received from Android WebView
    if (authToken) {
      // Check if token already has "Bearer " prefix or is in format "ENC Key=..."
      // If it starts with "Bearer " or "ENC", send as-is
      // Otherwise, assume it's a plain token and add "Bearer " prefix
      if (authToken.startsWith('Bearer ') || authToken.startsWith('ENC')) {
        headers['Authorization'] = authToken;
        if (shouldLog) {
          console.log('[API Client] Authorization header added (as-is, no Bearer prefix added)');
        }
      } else {
        headers['Authorization'] = `Bearer ${authToken}`;
        if (shouldLog) {
          console.log('[API Client] Authorization header added (with Bearer prefix)');
        }
      }
    } else {
      if (shouldLog) {
        console.log('[API Client] No Authorization header added (no token available)');
      }
    }

    if (shouldLog) {
      console.log('[API Client] Sending request to:', API_ROUTE);
      console.log('[API Client] Request headers:', {
        'Content-Type': headers['Content-Type'],
        'Authorization': headers['Authorization'] ? 'Bearer ***' : undefined,
      });
    }

    const response = await fetch(API_ROUTE, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: 'Failed to create deposit',
      }));
      throw new Error(error.error || 'Failed to create deposit');
    }

    return response.json();
  },

  async getFees(): Promise<FeesResponse> {
    const response = await fetch(FEES_ROUTE, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: 'Failed to get fee configuration',
      }));
      throw new Error(error.error || 'Failed to get fee configuration');
    }

    return response.json();
  },
};

