'use client';

import { useEffect } from 'react';
import { setupPostMessageListener, getAuthToken, setAuthToken } from '@/lib/auth';

/**
 * AuthProvider component to handle authentication in WebView context
 * Sets up postMessage listener and extracts token from URL
 * 
 * Note: Authorization header from Android WebView is handled by middleware.ts
 * which automatically stores it in httpOnly cookie
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const isDev = process.env.NODE_ENV !== 'production';
    
    if (isDev) {
      console.log('[AuthProvider] Initializing auth provider...');
    }
    
    // Setup postMessage listener for Android WebView
    setupPostMessageListener();

    // Extract token from URL if present (Android WebView can pass via URL)
    // This is a fallback method if header is not available
    const tokenFromUrl = getAuthToken();
    
    // If token from URL, store it in sessionStorage for client-side use
    if (tokenFromUrl) {
      if (isDev) {
        console.log('[AuthProvider] Token found and stored in sessionStorage');
      }
      setAuthToken(tokenFromUrl);
    } else {
      if (isDev) {
        console.log('[AuthProvider] No token found in URL or sessionStorage');
      }
    }
  }, []);

  return <>{children}</>;
}

