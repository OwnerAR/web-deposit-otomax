import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { CreateDepositRequest, CreateDepositResponse } from '@/types/deposit';

export function useDeposit() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDeposit = async (
    data: CreateDepositRequest
  ): Promise<CreateDepositResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.createDeposit(data);
      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Gagal membuat deposit';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createDeposit,
    isLoading,
    error,
  };
}

