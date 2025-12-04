'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { depositFormSchema, DepositFormData } from '@/lib/validation';
import { apiClient } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
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

interface DepositFormProps {
  defaultPaymentMethod?: PaymentMethod;
  hidePaymentMethodSelect?: boolean;
}

function DepositFormContent({ 
  defaultPaymentMethod = 'ALL',
  hidePaymentMethodSelect = false 
}: DepositFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [calculatedAmount, setCalculatedAmount] = useState<number | null>(null);
  
  // Get fee configuration from context (fetched once at app level)
  const { fees: feesConfig } = useFeesContext();
  
  // Logging for debugging
  const shouldLog = process.env.NEXT_PUBLIC_ENABLE_AUTH_LOGGING === 'true' || process.env.NODE_ENV !== 'production';
  
  // Don't check token on mount - TokenInjector will inject token from cookie to URL
  // Only check token when form is submitted to avoid race condition
  
  // Helper function to extract and clean token from URL query parameter or cookie
  const getTokenFromQuery = (): string | null => {
    if (typeof window === 'undefined') return null;
    
    const urlParams = new URLSearchParams(window.location.search);
    let tokenFromUrl = urlParams.get('authToken') || urlParams.get('token') || urlParams.get('auth_token');
    
    // Also try from Next.js searchParams
    if (!tokenFromUrl) {
      tokenFromUrl = searchParams.get('authToken') || searchParams.get('token') || searchParams.get('auth_token');
    }
    
    // If no token in URL, try to get from cookie as fallback (TokenInjector might not have run yet)
    if (!tokenFromUrl) {
      const tokenCookie = document.cookie
        .split('; ')
        .find((row) => row.startsWith('_auth_token_temp='));
      
      if (tokenCookie) {
        try {
          tokenFromUrl = decodeURIComponent(tokenCookie.split('=')[1]);
        } catch {
          // Ignore decode error
        }
      }
    }
    
    if (!tokenFromUrl) {
      return null;
    }
    
    // Decode URL encoding (handle multiple encodings)
    let decodedToken = tokenFromUrl;
    try {
      let previousDecode = decodedToken;
      for (let i = 0; i < 3; i++) {
        const newDecode = decodeURIComponent(decodedToken);
        if (newDecode === previousDecode) break;
        decodedToken = newDecode;
        previousDecode = decodedToken;
      }
    } catch {
      decodedToken = tokenFromUrl;
    }
    
    // Remove quotes jika ada (format: "ENC Key=...")
    let cleanToken = decodedToken.trim();
    if (cleanToken.startsWith('"') && cleanToken.endsWith('"')) {
      cleanToken = cleanToken.slice(1, -1).trim();
    }
    
    return cleanToken || null;
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
      // Get token langsung dari URL query parameter (token dipertahankan di URL sampai submit)
      const token = getTokenFromQuery();
      
      // ALWAYS log untuk debugging (critical)
      console.log('[DepositForm] ===== TOKEN RETRIEVAL (ON SUBMIT) =====');
      console.log('[DepositForm] Current URL:', typeof window !== 'undefined' ? window.location.href : 'N/A');
      console.log('[DepositForm] Token from query parameter:', token ? '✅ Yes' : '❌ No');
      
      // Jika tidak ada token, redirect ke 404
      if (!token) {
        console.error('[DepositForm] ❌❌❌ TOKEN IS NULL - Redirecting to 404 ❌❌❌');
        router.replace('/not-found');
        return;
      }
      
      if (token) {
        const maskedToken = token.length > 20 
          ? `${token.substring(0, 20)}...` 
          : token;
        console.log('[DepositForm] Token value (masked):', maskedToken);
        console.log('[DepositForm] Token length:', token.length);
      }
      
      // Prepare request data with token injected in body (token dari URL query parameter)
      const requestData: CreateDepositRequest = {
        amount: data.amount,
        phone_number: data.phone_number || undefined,
        payment_method: data.payment_method,
        // Inject token ke body dari query parameter
        auth_token: token,
      };

      // ALWAYS log request data (critical for debugging)
      console.log('[DepositForm] ===== REQUEST DATA PREPARED =====');
      console.log('[DepositForm] Amount:', requestData.amount);
      console.log('[DepositForm] Payment method:', requestData.payment_method);
      console.log('[DepositForm] Phone number:', requestData.phone_number ? '***' : undefined);
      console.log('[DepositForm] Auth token in body:', requestData.auth_token ? '✅✅✅ INJECTED' : '❌❌❌ NOT INJECTED');

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

// Wrap with Suspense to handle useSearchParams (required for Next.js)
export default function DepositForm(props: DepositFormProps) {
  return (
    <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
      <DepositFormContent {...props} />
    </Suspense>
  );
}

