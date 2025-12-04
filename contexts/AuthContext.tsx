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
      const allCookies = document.cookie.split('; ');
      if (shouldLog) {
        console.log('[AuthContext] All cookies:', allCookies);
      }
      
      const cookieToken = allCookies
        .find(row => row.startsWith('auth_token_client='))
        ?.split('=')[1];
      
      if (cookieToken) {
        // Decode URI component in case it's encoded
        const decodedToken = decodeURIComponent(cookieToken);
        setAuthToken(decodedToken);
        setTokenState(decodedToken);
        setIsLoading(false);
        if (shouldLog) {
          const maskedToken = decodedToken.length > 20 
            ? `${decodedToken.substring(0, 20)}...` 
            : decodedToken;
          console.log('[AuthContext] Token from cookie:', maskedToken);
        }
        return;
      }
      
      if (shouldLog) {
        console.log('[AuthContext] No token found in non-httpOnly cookie');
      }

      // Priority 3: Fetch current page to get x-auth-token header
      try {
        if (shouldLog) {
          console.log('[AuthContext] Fetching current page to get x-auth-token header...');
        }
        
        const pageResponse = await fetch(window.location.href, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });
        
        if (shouldLog) {
          console.log('[AuthContext] Page response status:', pageResponse.status);
          console.log('[AuthContext] Page response headers:', {
            'x-auth-token': pageResponse.headers.get('x-auth-token') ? 'Present' : 'Not present',
          });
        }
        
        const tokenFromHeader = pageResponse.headers.get('x-auth-token');
        if (tokenFromHeader) {
          setAuthToken(tokenFromHeader);
          setTokenState(tokenFromHeader);
          setIsLoading(false);
          if (shouldLog) {
            const maskedToken = tokenFromHeader.length > 20 
              ? `${tokenFromHeader.substring(0, 20)}...` 
              : tokenFromHeader;
            console.log('[AuthContext] ✅ Token from response header:', maskedToken);
          }
          return;
        } else {
          if (shouldLog) {
            console.log('[AuthContext] ❌ No x-auth-token header in response');
          }
        }
      } catch (error) {
        if (shouldLog) {
          console.log('[AuthContext] ❌ Could not fetch page to read header:', error);
        }
      }

      // Priority 4: Fetch from API endpoint (reads from httpOnly cookie)
      try {
        if (shouldLog) {
          console.log('[AuthContext] Fetching token from /api/auth/get-token...');
        }
        
        const response = await fetch('/api/auth/get-token', {
          method: 'GET',
          credentials: 'include',
        });

        if (shouldLog) {
          console.log('[AuthContext] API response status:', response.status);
        }

        if (response.ok) {
          const data = await response.json();
          if (data.token) {
            setAuthToken(data.token);
            setTokenState(data.token);
            if (shouldLog) {
              const maskedToken = data.token.length > 20 
                ? `${data.token.substring(0, 20)}...` 
                : data.token;
              console.log('[AuthContext] ✅ Token from API endpoint:', maskedToken);
            }
          } else {
            if (shouldLog) {
              console.log('[AuthContext] ❌ No token in API response');
            }
          }
        } else {
          if (shouldLog) {
            console.log('[AuthContext] ❌ API endpoint returned error:', response.status);
          }
        }
      } catch (error) {
        if (shouldLog) {
          console.log('[AuthContext] ❌ Could not fetch token from API:', error);
        }
      } finally {
        setIsLoading(false);
        if (shouldLog) {
          const finalToken = token || sessionStorage.getItem('auth_token');
          console.log('[AuthContext] Auth initialization complete. Final token available:', finalToken ? '✅' : '❌');
        }
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

