'use client';

import { useEffect } from 'react';

/**
 * Component to inject token script tag
 * This loads a script that sets token in sessionStorage
 */
export default function TokenScript() {
  useEffect(() => {
    // Only load script if we're in browser and don't have token yet
    if (typeof window === 'undefined') return;
    
    const hasToken = sessionStorage.getItem('auth_token');
    if (hasToken) {
      // Token already exists, no need to load script
      return;
    }

    // Create and inject script tag
    const script = document.createElement('script');
    script.src = '/api/auth/token-script';
    script.async = true;
    script.onload = () => {
      console.log('[TokenScript] Script loaded successfully');
    };
    script.onerror = () => {
      console.error('[TokenScript] Failed to load token script');
    };
    
    document.head.appendChild(script);

    return () => {
      // Cleanup: remove script on unmount
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  return null;
}

