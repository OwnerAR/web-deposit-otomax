import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api';
import { FeesResponse } from '@/types/fees';

// Cache fees globally to avoid multiple API calls
let feesCache: FeesResponse | null = null;
let feesPromise: Promise<FeesResponse> | null = null;

export function useFees() {
  const [fees, setFees] = useState<FeesResponse | null>(feesCache);
  const [isLoading, setIsLoading] = useState(!feesCache);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Skip if already fetched or cached
    if (feesCache || hasFetched.current) {
      return;
    }

    const fetchFees = async () => {
      try {
        // Use existing promise if already fetching
        if (feesPromise) {
          const data = await feesPromise;
          setFees(data);
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        setError(null);
        
        // Create new promise
        feesPromise = apiClient.getFees();
        const data = await feesPromise;
        
        // Cache the result
        feesCache = data;
        setFees(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get fee configuration';
        setError(errorMessage);
        console.error('Error fetching fees:', errorMessage);
        // Reset promise on error so it can be retried
        feesPromise = null;
      } finally {
        setIsLoading(false);
        hasFetched.current = true;
      }
    };

    fetchFees();
  }, []);

  return {
    fees,
    isLoading,
    error,
  };
}

