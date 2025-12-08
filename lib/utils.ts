import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { FeesResponse } from '@/types/fees';
import { PaymentMethod } from '@/types/deposit';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculate fee based on payment method and fee configuration from API
 * @param amount - Deposit amount
 * @param paymentMethod - Payment method
 * @param feesConfig - Fee configuration from API (required)
 * @returns Calculated fee amount, returns 0 if feesConfig is not available or payment method not found
 */
export function calculateFee(
  amount: number,
  paymentMethod: PaymentMethod,
  feesConfig?: FeesResponse | null
): number {
  // Return 0 if feesConfig is not available
  if (!feesConfig) {
    return 0;
  }

  // Map payment method to API response key
  const methodKeyMap: Record<PaymentMethod, keyof FeesResponse> = {
    VA_BANK: 'va_bank',
    RETAIL: 'retail',
    QRIS: 'qris',
    EWALLET: 'ewallet',
  };

  const methodKey = methodKeyMap[paymentMethod];
  const feeConfig = feesConfig[methodKey];

  if (!feeConfig) {
    return 0;
  }

  if (feeConfig.type === 'static') {
    return feeConfig.value;
  } else if (feeConfig.type === 'percentage') {
    return Math.round(amount * feeConfig.value);
  }

  return 0;
}

export function formatPhoneNumber(phone: string): string {
  // Remove non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Format: 08XX-XXXX-XXXX
  if (digits.length >= 4) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 12)}`;
  }
  return digits;
}

