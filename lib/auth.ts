/**
 * Utility functions for handling authentication in WebView context
 */

const AUTH_TOKEN_KEY = 'auth_token';

/**
 * Get auth token from various sources (priority order):
 * 1. URL parameter (for Android WebView integration)
 * 2. sessionStorage (if previously stored)
 * 3. postMessage from Android app (if available)
 */
export function getAuthToken(): string | null {
  // Logging (can be enabled via ENABLE_AUTH_LOGGING env var, or auto-enabled in development)
  const shouldLog = process.env.NEXT_PUBLIC_ENABLE_AUTH_LOGGING === 'true' || process.env.NODE_ENV !== 'production';
  
  // 1. Check URL parameter (Android WebView can pass token via URL)
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token') || urlParams.get('auth_token');
    if (tokenFromUrl) {
      // Store in sessionStorage for subsequent requests
      sessionStorage.setItem(AUTH_TOKEN_KEY, tokenFromUrl);
      if (shouldLog) {
        const maskedToken = tokenFromUrl.length > 20 
          ? `${tokenFromUrl.substring(0, 20)}...` 
          : tokenFromUrl;
        console.log('[Auth] Token found in URL parameter:', maskedToken);
      }
      return tokenFromUrl;
    }

    // 2. Check sessionStorage
    const tokenFromStorage = sessionStorage.getItem(AUTH_TOKEN_KEY);
    if (tokenFromStorage) {
      if (shouldLog) {
        const maskedToken = tokenFromStorage.length > 20 
          ? `${tokenFromStorage.substring(0, 20)}...` 
          : tokenFromStorage;
        console.log('[Auth] Token found in sessionStorage:', maskedToken);
      }
      return tokenFromStorage;
    }

    // 3. Listen for postMessage from Android app (if needed)
    // This would be set up in a useEffect in the app
    
    if (shouldLog) {
      console.log('[Auth] No token found in URL or sessionStorage');
    }
  }

  return null;
}

/**
 * Set auth token (for manual setting or postMessage handler)
 */
export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(AUTH_TOKEN_KEY, token);
  }
}

/**
 * Clear auth token
 */
export function clearAuthToken(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

/**
 * Setup postMessage listener for Android WebView
 * Call this in your root layout or app component
 */
export function setupPostMessageListener(): void {
  if (typeof window === 'undefined') return;

  const shouldLog = process.env.NEXT_PUBLIC_ENABLE_AUTH_LOGGING === 'true' || process.env.NODE_ENV !== 'production';

  window.addEventListener('message', (event) => {
    // Logging
    if (shouldLog) {
      console.log('[Auth] PostMessage received:', {
        origin: event.origin,
        type: event.data?.type,
        hasToken: !!event.data?.token,
      });
    }

    // Verify origin if needed (for security)
    // if (event.origin !== 'expected-origin') return;

    // Handle token from Android app
    if (event.data && event.data.type === 'AUTH_TOKEN') {
      const token = event.data.token;
      if (token) {
        if (shouldLog) {
          const maskedToken = token.length > 20 
            ? `${token.substring(0, 20)}...` 
            : token;
          console.log('[Auth] Token received via postMessage:', maskedToken);
        }
        setAuthToken(token);
      }
    }
  });
}

