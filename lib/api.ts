import { CreateDepositRequest, CreateDepositResponse } from '@/types/deposit';
import { ApiError } from '@/types/api';
import { FeesResponse } from '@/types/fees';
import { getAuthToken } from './auth';

// Use Next.js API route as proxy to handle Authorization header
const API_ROUTE = '/api/deposit/create';
const FEES_ROUTE = '/api/deposit/fees';

export const apiClient = {
  async createDeposit(data: CreateDepositRequest): Promise<CreateDepositResponse> {
    // Get auth token (from URL param, sessionStorage, or postMessage)
    const authToken = getAuthToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add Authorization header if token is available
    // Note: In WebView, the Authorization header should be set by Android app
    // This is a fallback for token passed via URL/postMessage
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
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

