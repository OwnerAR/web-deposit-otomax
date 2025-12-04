import { CreateDepositRequest, CreateDepositResponse } from '@/types/deposit';
import { ApiError } from '@/types/api';
import { FeesResponse } from '@/types/fees';

// Use Next.js API route as proxy to handle Authorization header
const API_ROUTE = '/api/deposit/create';
const FEES_ROUTE = '/api/deposit/fees';

export const apiClient = {
  async createDeposit(data: CreateDepositRequest): Promise<CreateDepositResponse> {
    // Logging (can be enabled via ENABLE_AUTH_LOGGING env var, or auto-enabled in development)
    const shouldLog = process.env.NEXT_PUBLIC_ENABLE_AUTH_LOGGING === 'true' || process.env.NODE_ENV !== 'production';
    
    if (shouldLog) {
      console.log('[API Client] Creating deposit request...');
      console.log('[API Client] Request data:', {
        amount: data.amount,
        payment_method: data.payment_method,
        phone_number: data.phone_number ? '***' : undefined,
        auth_token: data.auth_token ? '*** (already injected in DepositForm)' : undefined,
      });
    }
    
    // Token is already injected in DepositForm component
    // Just send the data as-is (token is in body.auth_token)
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (shouldLog) {
      console.log('[API Client] Sending request to:', API_ROUTE);
      console.log('[API Client] Request body:', {
        amount: data.amount,
        payment_method: data.payment_method,
        phone_number: data.phone_number ? '***' : undefined,
        auth_token: data.auth_token ? '*** (in body)' : '❌ Not present',
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

