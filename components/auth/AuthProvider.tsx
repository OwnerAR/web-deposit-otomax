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

    // Priority 2: Read token from multiple sources (server-side)
    // Strategy: Try multiple methods since cookies might not work in WebView
    const fetchTokenFromServer = async () => {
      // Method 1: Try to read from non-httpOnly cookie (if available)
      const cookieToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token_client='))
        ?.split('=')[1];
      
      if (cookieToken) {
        setAuthToken(cookieToken);
        if (shouldLog) {
          const maskedToken = cookieToken.length > 20 
            ? `${cookieToken.substring(0, 20)}...` 
            : cookieToken;
          console.log('[AuthProvider] Token read from non-httpOnly cookie:', maskedToken);
        }
        return;
      }

      // Method 2: Fetch current page to get x-auth-token header
      try {
        const pageResponse = await fetch(window.location.href, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });
        
        const tokenFromHeader = pageResponse.headers.get('x-auth-token');
        if (tokenFromHeader) {
          setAuthToken(tokenFromHeader);
          if (shouldLog) {
            const maskedToken = tokenFromHeader.length > 20 
              ? `${tokenFromHeader.substring(0, 20)}...` 
              : tokenFromHeader;
            console.log('[AuthProvider] Token read from response header (x-auth-token):', maskedToken);
          }
          return;
        }
      } catch (error) {
        if (shouldLog) {
          console.log('[AuthProvider] Could not fetch page to read header:', error);
        }
      }

      // Method 3: Fetch from API endpoint (reads from httpOnly cookie)
      try {
        const response = await fetch('/api/auth/get-token', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.token) {
            setAuthToken(data.token);
            if (shouldLog) {
              const maskedToken = data.token.length > 20 
                ? `${data.token.substring(0, 20)}...` 
                : data.token;
              console.log('[AuthProvider] Token fetched from API endpoint:', maskedToken);
            }
          }
        }
      } catch (error) {
        if (shouldLog) {
          console.log('[AuthProvider] Could not fetch token from API endpoint:', error);
        }
      }
    };

    fetchTokenFromServer();
  }, []);

  return <>{children}</>;
}

