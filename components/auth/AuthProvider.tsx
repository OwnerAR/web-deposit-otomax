'use client';

import { useEffect } from 'react';
import { setupPostMessageListener, getAuthToken, setAuthToken } from '@/lib/auth';

/**
 * AuthProvider component to handle authentication in WebView context
 * Sets up postMessage listener and extracts token from URL
 * 
 * Strategy:
 * 1. Middleware captures Authorization header and stores in cookie (server-side fallback)
 * 2. Client-side fetches token from API endpoint that reads cookie
 * 3. Client-side stores token in sessionStorage for subsequent API calls
 * 4. Client-side sends Authorization header directly via fetch API
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Logging (can be enabled via ENABLE_AUTH_LOGGING env var, or auto-enabled in development)
    const shouldLog = process.env.NEXT_PUBLIC_ENABLE_AUTH_LOGGING === 'true' || process.env.NODE_ENV !== 'production';
    
    if (shouldLog) {
      console.log('[AuthProvider] Initializing auth provider...');
    }
    
    // Setup postMessage listener for Android WebView
    setupPostMessageListener();

    // Priority 1: Extract token from URL if present (Android WebView can pass via URL)
    const tokenFromUrl = getAuthToken();
    
    if (tokenFromUrl) {
      if (shouldLog) {
        console.log('[AuthProvider] Token found in URL and stored in sessionStorage');
      }
      // Token already stored by getAuthToken()
      return;
    }

    // Priority 2: Fetch token from server (middleware stored it in cookie)
    // This handles the case where Authorization header was sent but cookie didn't work
    const fetchTokenFromServer = async () => {
      try {
        const response = await fetch('/api/auth/get-token', {
          method: 'GET',
          credentials: 'include', // Important: include cookies
        });

        if (response.ok) {
          const data = await response.json();
          if (data.token) {
            setAuthToken(data.token);
            if (shouldLog) {
              const maskedToken = data.token.length > 20 
                ? `${data.token.substring(0, 20)}...` 
                : data.token;
              console.log('[AuthProvider] Token fetched from server and stored:', maskedToken);
            }
          }
        }
      } catch (error) {
        if (shouldLog) {
          console.log('[AuthProvider] Could not fetch token from server:', error);
        }
      }
    };

    fetchTokenFromServer();
  }, []);

  return <>{children}</>;
}

