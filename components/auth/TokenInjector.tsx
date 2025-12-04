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

    // Check if token already in URL
    const urlParams = new URLSearchParams(window.location.search);
    const hasTokenParam =
      urlParams.has('authToken') ||
      urlParams.has('token') ||
      urlParams.has('auth_token');

    if (hasTokenParam) {
      return; // Token already in URL, no need to inject
    }

    // Try to get token from cookie
    const tokenCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('_auth_token_temp='));

    if (tokenCookie) {
      const token = decodeURIComponent(tokenCookie.split('=')[1]);

      // Inject token to URL query parameter without reload
      urlParams.set('authToken', token);
      const newSearch = urlParams.toString();
      const newUrl = `${pathname}${newSearch ? `?${newSearch}` : ''}${window.location.hash}`;

      // Use router.replace to update URL without reload (client-side navigation)
      router.replace(newUrl, { scroll: false });

      // Delete cookie after injecting to URL
      document.cookie = '_auth_token_temp=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
  }, [pathname, router]);

  return null; // This component doesn't render anything
}

