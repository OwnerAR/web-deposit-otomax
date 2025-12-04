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
  // 1. Check URL parameter (Android WebView can pass token via URL)
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token') || urlParams.get('auth_token');
    if (tokenFromUrl) {
      // Store in sessionStorage for subsequent requests
      sessionStorage.setItem(AUTH_TOKEN_KEY, tokenFromUrl);
      return tokenFromUrl;
    }

    // 2. Check sessionStorage
    const tokenFromStorage = sessionStorage.getItem(AUTH_TOKEN_KEY);
    if (tokenFromStorage) {
      return tokenFromStorage;
    }

    // 3. Listen for postMessage from Android app (if needed)
    // This would be set up in a useEffect in the app
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

  window.addEventListener('message', (event) => {
    // Verify origin if needed (for security)
    // if (event.origin !== 'expected-origin') return;

    // Handle token from Android app
    if (event.data && event.data.type === 'AUTH_TOKEN') {
      const token = event.data.token;
      if (token) {
        setAuthToken(token);
      }
    }
  });
}

