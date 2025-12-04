'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useFees } from '@/hooks/useFees';
import { FeesResponse } from '@/types/fees';

interface FeesContextValue {
  fees: FeesResponse | null;
  isLoading: boolean;
  error: string | null;
}

const FeesContext = createContext<FeesContextValue | undefined>(undefined);

export function FeesProvider({ children }: { children: ReactNode }) {
  const { fees, isLoading, error } = useFees();

  return (
    <FeesContext.Provider value={{ fees, isLoading, error }}>
      {children}
    </FeesContext.Provider>
  );
}

export function useFeesContext() {
  const context = useContext(FeesContext);
  if (context === undefined) {
    throw new Error('useFeesContext must be used within a FeesProvider');
  }
  return context;
}

