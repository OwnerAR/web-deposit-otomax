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
      console.log('[API Client] Request data (before token injection):', {
        amount: data.amount,
        payment_method: data.payment_method,
        phone_number: data.phone_number ? '***' : undefined,
      });
    }
    
    // Prepare request body - inject token into body (not in header)
    // Token is injected automatically, not shown in form
    const requestBody: CreateDepositRequest = {
      ...data,
      // Inject token into body if available
      ...(authToken && { auth_token: authToken }),
    };
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (shouldLog) {
      console.log('[API Client] Sending request to:', API_ROUTE);
      console.log('[API Client] Request body (token injected):', {
        amount: requestBody.amount,
        payment_method: requestBody.payment_method,
        phone_number: requestBody.phone_number ? '***' : undefined,
        auth_token: requestBody.auth_token ? '*** (injected)' : undefined,
      });
    }

    const response = await fetch(API_ROUTE, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
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

