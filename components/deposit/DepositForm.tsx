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
  const [authToken, setAuthToken] = useState<string | null>(null); // Store token in state
  
  // Get fee configuration from context (fetched once at app level)
  const { fees: feesConfig } = useFeesContext();
  
  // Logging for debugging
  const shouldLog = process.env.NEXT_PUBLIC_ENABLE_AUTH_LOGGING === 'true' || process.env.NODE_ENV !== 'production';
  
  // Extract and store token from URL query parameter on mount
  // Token akan dipertahankan di state sampai submit - ini memastikan token tetap tersedia
  useEffect(() => {
    const extractAndStoreToken = () => {
      if (typeof window === 'undefined') return;
      
      // ALWAYS log for debugging
      console.log('[DepositForm] ===== EXTRACTING TOKEN ON MOUNT =====');
      console.log('[DepositForm] Current URL:', window.location.href);
      console.log('[DepositForm] Search:', window.location.search);
      
      // Try to get from URL query parameter
      const urlParams = new URLSearchParams(window.location.search);
      let tokenFromUrl = urlParams.get('authToken') || urlParams.get('token') || urlParams.get('auth_token');
      
      // Also try from Next.js searchParams (as fallback)
      if (!tokenFromUrl) {
        tokenFromUrl = searchParams.get('authToken') || searchParams.get('token') || searchParams.get('auth_token');
      }
      
      if (!tokenFromUrl) {
        console.log('[DepositForm] ❌ No token found in URL query parameters on mount');
        console.log('[DepositForm] All URL params:', Array.from(urlParams.keys()));
        console.log('[DepositForm] All searchParams:', Array.from(searchParams.keys()));
        return;
      }
      
      console.log('[DepositForm] ✅ Token found in URL on mount, extracting...');
      console.log('[DepositForm] Raw token (first 50 chars):', tokenFromUrl.substring(0, 50) + '...');
      console.log('[DepositForm] Raw token length:', tokenFromUrl.length);
      
      // Decode URL encoding (handle multiple encodings)
      let decodedToken = tokenFromUrl;
      try {
        let previousDecode = decodedToken;
        for (let i = 0; i < 3; i++) {
          const newDecode = decodeURIComponent(decodedToken);
          if (newDecode === previousDecode) {
            console.log(`[DepositForm] Decode iteration ${i}: No change, stopping`);
            break;
          }
          decodedToken = newDecode;
          previousDecode = decodedToken;
        }
        console.log('[DepositForm] After decode (first 50 chars):', decodedToken.substring(0, 50) + '...');
      } catch (error) {
        console.log('[DepositForm] ⚠️ Decode failed, using as-is:', error);
        decodedToken = tokenFromUrl;
      }
      
      // Remove quotes jika ada (format: "ENC Key=...")
      let cleanToken = decodedToken.trim();
      if (cleanToken.startsWith('"') && cleanToken.endsWith('"')) {
        cleanToken = cleanToken.slice(1, -1).trim();
        console.log('[DepositForm] Removed quotes');
      }
      
      if (cleanToken) {
        setAuthToken(cleanToken); // Store token in state - akan dipertahankan sampai submit
        const maskedToken = cleanToken.length > 20 
          ? `${cleanToken.substring(0, 20)}...` 
          : cleanToken;
        console.log('[DepositForm] ✅✅✅ Token stored in state (will persist until submit):', maskedToken);
        console.log('[DepositForm] Token length:', cleanToken.length);
      } else {
        console.error('[DepositForm] ❌ Token is empty after cleaning');
      }
    };
    
    extractAndStoreToken();
  }, [searchParams]); // Only depend on searchParams, not shouldLog
  
  // Helper function to get token (from state - token sudah dipertahankan sampai submit)
  // Format: ?authToken="ENC Key=..." 
  // Middleware akan redirect dengan format ini saat menerima Authorization header
  // Token sudah disimpan di state saat component mount, sehingga tetap tersedia sampai submit
  const getAuthToken = (): string | null => {
    // Use token from state (stored on mount, persists until submit)
    if (authToken) {
      if (shouldLog) {
        const maskedToken = authToken.length > 20 
          ? `${authToken.substring(0, 20)}...` 
          : authToken;
        console.log('[DepositForm] ✅ Using token from state (persisted):', maskedToken);
      }
      return authToken;
    }
    
    // Priority 2: Try to get from URL query parameter (fallback)
    if (typeof window === 'undefined') return null;
    
    if (shouldLog) {
      console.log('[DepositForm] Getting token from URL...');
      console.log('[DepositForm] Current URL:', window.location.href);
      console.log('[DepositForm] Search:', window.location.search);
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const allParams = Array.from(urlParams.entries());
    
    if (shouldLog) {
      console.log('[DepositForm] All query params:', allParams.map(([key]) => key));
    }
    
    let tokenFromUrl = urlParams.get('authToken') || urlParams.get('token') || urlParams.get('auth_token');
    
    if (!tokenFromUrl) {
      if (shouldLog) {
        console.log('[DepositForm] ❌ No token found in URL query parameters');
        console.log('[DepositForm] Checked params: authToken, token, auth_token');
        console.log('[DepositForm] All params:', allParams);
      }
      return null;
    }
    
    if (shouldLog) {
      console.log('[DepositForm] ✅ Token found in URL');
      console.log('[DepositForm] Raw token (first 100 chars):', tokenFromUrl.substring(0, 100) + '...');
      console.log('[DepositForm] Raw token length:', tokenFromUrl.length);
    }
    
    // Decode URL encoding (handle multiple encodings)
    let decodedToken = tokenFromUrl;
    try {
      // Try decode multiple times (handle double encoding)
      let previousDecode = decodedToken;
      for (let i = 0; i < 3; i++) {
        const newDecode = decodeURIComponent(decodedToken);
        if (newDecode === previousDecode) {
          if (shouldLog && i > 0) {
            console.log(`[DepositForm] Decode iteration ${i}: No change, stopping`);
          }
          break; // Stop if no change
        }
        decodedToken = newDecode;
        previousDecode = decodedToken;
      }
      
      if (shouldLog) {
        console.log('[DepositForm] After decode (first 100 chars):', decodedToken.substring(0, 100) + '...');
        console.log('[DepositForm] After decode length:', decodedToken.length);
      }
    } catch (error) {
      if (shouldLog) {
        console.log('[DepositForm] ⚠️ Decode failed, using as-is:', error);
      }
      decodedToken = tokenFromUrl;
    }
    
    // Remove quotes jika ada (format: "ENC Key=...")
    let cleanToken = decodedToken.trim();
    if (cleanToken.startsWith('"') && cleanToken.endsWith('"')) {
      cleanToken = cleanToken.slice(1, -1).trim(); // Remove first and last character (quotes)
      
      if (shouldLog) {
        console.log('[DepositForm] Removed quotes');
        console.log('[DepositForm] After removing quotes (first 100 chars):', cleanToken.substring(0, 100) + '...');
        console.log('[DepositForm] After removing quotes length:', cleanToken.length);
      }
    }
    
    if (cleanToken) {
      if (shouldLog) {
        const maskedToken = cleanToken.length > 20 
          ? `${cleanToken.substring(0, 20)}...` 
          : cleanToken;
        console.log('[DepositForm] ✅ Token final (cleaned):', maskedToken);
        console.log('[DepositForm] Token length:', cleanToken.length);
      }
      return cleanToken;
    }
    
    if (shouldLog) {
      console.log('[DepositForm] ❌ Token is empty after cleaning');
      console.log('[DepositForm] Decoded token was:', decodedToken);
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
      // Get token from URL query parameter (ONLY SOURCE)
      const authToken = getAuthToken();
      
      // ALWAYS log token retrieval (critical for debugging)
      console.log('[DepositForm] ===== TOKEN RETRIEVAL =====');
      console.log('[DepositForm] Token retrieved:', authToken ? '✅ Yes' : '❌ No');
      console.log('[DepositForm] Current URL:', typeof window !== 'undefined' ? window.location.href : 'N/A');
      console.log('[DepositForm] Query params:', typeof window !== 'undefined' ? window.location.search : 'N/A');
      
      if (authToken) {
        const maskedToken = authToken.length > 20 
          ? `${authToken.substring(0, 20)}...` 
          : authToken;
        console.log('[DepositForm] Token value (masked):', maskedToken);
        console.log('[DepositForm] Token length:', authToken.length);
      } else {
        console.error('[DepositForm] ❌❌❌ TOKEN IS NULL - CHECK URL QUERY PARAMETER ❌❌❌');
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          console.error('[DepositForm] Available query params:', Array.from(urlParams.keys()));
          console.error('[DepositForm] authToken param:', urlParams.get('authToken'));
          console.error('[DepositForm] token param:', urlParams.get('token'));
          console.error('[DepositForm] auth_token param:', urlParams.get('auth_token'));
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

      // ALWAYS log request data (critical for debugging)
      console.log('[DepositForm] ===== REQUEST DATA PREPARED =====');
      console.log('[DepositForm] Amount:', requestData.amount);
      console.log('[DepositForm] Payment method:', requestData.payment_method);
      console.log('[DepositForm] Phone number:', requestData.phone_number ? '***' : undefined);
      console.log('[DepositForm] Auth token in body:', requestData.auth_token ? '✅ INJECTED' : '❌ NOT INJECTED');
      
      if (!requestData.auth_token) {
        console.error('[DepositForm] ❌❌❌ WARNING: Token will NOT be sent to backend! ❌❌❌');
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

// Wrap with Suspense to handle useSearchParams (required for Next.js)
export default function DepositForm(props: DepositFormProps) {
  return (
    <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
      <DepositFormContent {...props} />
    </Suspense>
  );
}

