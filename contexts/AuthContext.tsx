'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAuthToken, setAuthToken } from '@/lib/auth';

interface AuthContextValue {
  token: string | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const shouldLog = process.env.NEXT_PUBLIC_ENABLE_AUTH_LOGGING === 'true' || process.env.NODE_ENV !== 'production';

  useEffect(() => {
    const initializeAuth = async () => {
      if (shouldLog) {
        console.log('[AuthContext] Initializing auth...');
      }

      // Priority 1: Check URL parameter
      const tokenFromUrl = getAuthToken();
      if (tokenFromUrl) {
        setTokenState(tokenFromUrl);
        setIsLoading(false);
        if (shouldLog) {
          const maskedToken = tokenFromUrl.length > 20 
            ? `${tokenFromUrl.substring(0, 20)}...` 
            : tokenFromUrl;
          console.log('[AuthContext] Token from URL:', maskedToken);
        }
        return;
      }

      // Priority 2: Try to read from non-httpOnly cookie
      const cookieToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token_client='))
        ?.split('=')[1];
      
      if (cookieToken) {
        setAuthToken(cookieToken);
        setTokenState(cookieToken);
        setIsLoading(false);
        if (shouldLog) {
          const maskedToken = cookieToken.length > 20 
            ? `${cookieToken.substring(0, 20)}...` 
            : cookieToken;
          console.log('[AuthContext] Token from cookie:', maskedToken);
        }
        return;
      }

      // Priority 3: Fetch current page to get x-auth-token header
      try {
        const pageResponse = await fetch(window.location.href, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });
        
        const tokenFromHeader = pageResponse.headers.get('x-auth-token');
        if (tokenFromHeader) {
          setAuthToken(tokenFromHeader);
          setTokenState(tokenFromHeader);
          setIsLoading(false);
          if (shouldLog) {
            const maskedToken = tokenFromHeader.length > 20 
              ? `${tokenFromHeader.substring(0, 20)}...` 
              : tokenFromHeader;
            console.log('[AuthContext] Token from response header:', maskedToken);
          }
          return;
        }
      } catch (error) {
        if (shouldLog) {
          console.log('[AuthContext] Could not fetch page to read header:', error);
        }
      }

      // Priority 4: Fetch from API endpoint
      try {
        const response = await fetch('/api/auth/get-token', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.token) {
            setAuthToken(data.token);
            setTokenState(data.token);
            if (shouldLog) {
              const maskedToken = data.token.length > 20 
                ? `${data.token.substring(0, 20)}...` 
                : data.token;
              console.log('[AuthContext] Token from API endpoint:', maskedToken);
            }
          }
        }
      } catch (error) {
        if (shouldLog) {
          console.log('[AuthContext] Could not fetch token from API:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ token, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

