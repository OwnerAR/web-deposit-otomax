'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * Client-side component to inject token from cookie to URL query parameter
 * without page reload
 */
export default function TokenInjector() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return;

    // Skip API routes
    if (pathname?.startsWith('/api/')) return;

    // Logging for debugging
    const shouldLog = process.env.NEXT_PUBLIC_ENABLE_AUTH_LOGGING === 'true' || process.env.NODE_ENV !== 'production';

    if (shouldLog) {
      console.log('[TokenInjector] Component mounted, pathname:', pathname);
    }

    // Check if token already in URL
    const urlParams = new URLSearchParams(window.location.search);
    const hasTokenParam =
      urlParams.has('authToken') ||
      urlParams.has('token') ||
      urlParams.has('auth_token');

    if (shouldLog) {
      console.log('[TokenInjector] Token in URL:', hasTokenParam ? '✅ Present' : '❌ Not present');
    }

    if (hasTokenParam) {
      if (shouldLog) {
        console.log('[TokenInjector] Token already in URL, no injection needed');
      }
      return; // Token already in URL, no need to inject
    }

    // Try to get token from cookie
    const tokenCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('_auth_token_temp='));

    if (shouldLog) {
      console.log('[TokenInjector] Cookie check:', tokenCookie ? '✅ Found' : '❌ Not found');
      if (tokenCookie) {
        const maskedCookie = tokenCookie.length > 50 
          ? `${tokenCookie.substring(0, 50)}...` 
          : tokenCookie;
        console.log('[TokenInjector] Cookie value (masked):', maskedCookie);
      }
    }

    if (tokenCookie) {
      const token = decodeURIComponent(tokenCookie.split('=')[1]);

      if (shouldLog) {
        const maskedToken = token.length > 30 
          ? `${token.substring(0, 30)}...` 
          : token;
        console.log('[TokenInjector] ✅ Injecting token to URL (masked):', maskedToken);
      }

      // Inject token to URL query parameter without reload
      urlParams.set('authToken', token);
      const newSearch = urlParams.toString();
      const newUrl = `${pathname}${newSearch ? `?${newSearch}` : ''}${window.location.hash}`;

      if (shouldLog) {
        console.log('[TokenInjector] New URL:', newUrl);
      }

      // Use router.replace to update URL without reload (client-side navigation)
      router.replace(newUrl, { scroll: false });

      // Delete cookie after injecting to URL
      document.cookie = '_auth_token_temp=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

      if (shouldLog) {
        console.log('[TokenInjector] ✅ Token injected to URL and cookie deleted');
      }
    } else {
      if (shouldLog) {
        console.log('[TokenInjector] ⚠️ No token cookie found, cannot inject to URL');
      }
    }
  }, [pathname, router]);

  return null; // This component doesn't render anything
}

