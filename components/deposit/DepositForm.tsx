'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { depositFormSchema, DepositFormData } from '@/lib/validation';
import { apiClient } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import AmountInput from './AmountInput';
import PhoneInput from './PhoneInput';
import PaymentMethodSelect from './PaymentMethodSelect';
import PaymentSummary from './PaymentSummary';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { calculateFee } from '@/lib/utils';
import { PaymentMethod, CreateDepositRequest } from '@/types/deposit';
import { useFeesContext } from '@/contexts/FeesContext';
import { useAuth } from '@/contexts/AuthContext';

interface DepositFormProps {
  defaultPaymentMethod?: PaymentMethod;
  hidePaymentMethodSelect?: boolean;
}

export default function DepositForm({ 
  defaultPaymentMethod = 'ALL',
  hidePaymentMethodSelect = false 
}: DepositFormProps = {}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [calculatedAmount, setCalculatedAmount] = useState<number | null>(null);
  
  // Get fee configuration from context (fetched once at app level)
  const { fees: feesConfig } = useFeesContext();
  
  // Get auth token from context (optional, untuk display/logging saja)
  const { token: authTokenFromContext } = useAuth();
  
  // Logging for debugging
  const shouldLog = process.env.NEXT_PUBLIC_ENABLE_AUTH_LOGGING === 'true' || process.env.NODE_ENV !== 'production';
  
  // Helper function to get token directly from cookie or API
  // This is called on-demand during form submit (not stored in state)
  const getAuthToken = async (): Promise<string | null> => {
    if (typeof window === 'undefined') return null;
    
    // Priority 1: Read from non-httpOnly cookie (fastest, client-side accessible)
    const cookies = document.cookie.split('; ');
    const cookieToken = cookies
      .find(row => row.startsWith('auth_token_client='))
      ?.split('=')[1];
    
    if (cookieToken) {
      const decodedToken = decodeURIComponent(cookieToken);
      if (shouldLog) {
        const maskedToken = decodedToken.length > 20 
          ? `${decodedToken.substring(0, 20)}...` 
          : decodedToken;
        console.log('[DepositForm] Token from cookie:', maskedToken);
      }
      return decodedToken;
    }
    
    // Priority 2: Fetch from API endpoint (reads from httpOnly cookie)
    try {
      const response = await fetch('/api/auth/get-token', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          if (shouldLog) {
            const maskedToken = data.token.length > 20 
              ? `${data.token.substring(0, 20)}...` 
              : data.token;
            console.log('[DepositForm] Token from API endpoint:', maskedToken);
          }
          return data.token;
        }
      }
    } catch (error) {
      if (shouldLog) {
        console.log('[DepositForm] Failed to fetch token from API:', error);
      }
    }
    
    // Priority 3: Use token from context (if available)
    if (authTokenFromContext) {
      if (shouldLog) {
        const maskedToken = authTokenFromContext.length > 20 
          ? `${authTokenFromContext.substring(0, 20)}...` 
          : authTokenFromContext;
        console.log('[DepositForm] Token from context:', maskedToken);
      }
      return authTokenFromContext;
    }
    
    return null;
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DepositFormData>({
    resolver: zodResolver(depositFormSchema),
    defaultValues: {
      amount: undefined as any, // Empty by default - will show as empty input
      phone_number: '',
      payment_method: defaultPaymentMethod,
    },
  });

  const amount = watch('amount');
  const paymentMethod = watch('payment_method');

  // Calculate total amount with fee using API configuration
  useEffect(() => {
    if (amount > 0 && paymentMethod) {
      // Calculate fee based on payment method using API fees config
      const fee = calculateFee(amount, paymentMethod, feesConfig);
      setCalculatedAmount(amount + fee);
    } else {
      setCalculatedAmount(null);
    }
  }, [amount, paymentMethod, feesConfig]);

  const onSubmit = async (data: DepositFormData) => {
    setIsLoading(true);
    
    if (shouldLog) {
      console.log('[DepositForm] Submitting form...');
    }
    
    try {
      // Get token directly from cookie/API (not from state/sessionStorage)
      const authToken = await getAuthToken();
      
      if (shouldLog) {
        console.log('[DepositForm] Token retrieved:', authToken ? '✅ Yes' : '❌ No');
        if (authToken) {
          const maskedToken = authToken.length > 20 
            ? `${authToken.substring(0, 20)}...` 
            : authToken;
          console.log('[DepositForm] Token value:', maskedToken);
        }
      }
      
      // Prepare request data with token injected in body (not shown in UI)
      const requestData: CreateDepositRequest = {
        amount: data.amount,
        phone_number: data.phone_number || undefined,
        payment_method: data.payment_method,
        // Inject token into body if available (automatically, not shown in form)
        ...(authToken && { auth_token: authToken }),
      };

      if (shouldLog) {
        console.log('[DepositForm] Request data prepared:', {
          amount: requestData.amount,
          payment_method: requestData.payment_method,
          phone_number: requestData.phone_number ? '***' : undefined,
          auth_token: requestData.auth_token ? '*** (injected)' : '❌ Not injected',
        });
      }

      const response = await apiClient.createDeposit(requestData);

      toast.success('Invoice berhasil dibuat!');
      
      // Redirect to Xendit checkout or success page
      if (response.invoice_url) {
        window.location.href = response.invoice_url;
      } else {
        router.push(`/success?ticket_id=${response.ticket_id}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal membuat deposit');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-4 md:p-6 lg:p-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 md:space-y-6">
        <AmountInput
          {...register('amount', { 
            valueAsNumber: true,
          })}
          error={errors.amount?.message}
        />

        <PhoneInput
          {...register('phone_number')}
          error={errors.phone_number?.message}
        />

        {!hidePaymentMethodSelect && (
          <PaymentMethodSelect
            value={paymentMethod}
            onChange={(value) => setValue('payment_method', value as DepositFormData['payment_method'])}
            error={errors.payment_method?.message}
          />
        )}
        
        {hidePaymentMethodSelect && (
          <input
            type="hidden"
            {...register('payment_method')}
            value={defaultPaymentMethod}
          />
        )}

        {calculatedAmount && (
          <PaymentSummary
            baseAmount={amount}
            totalAmount={calculatedAmount}
            paymentMethod={paymentMethod}
          />
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? 'Memproses...' : 'Buat Invoice'}
        </Button>
      </form>
    </Card>
  );
}

