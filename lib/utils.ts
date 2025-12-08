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
 * @param feesConfig - Fee configuration from API (optional, will use fallback if not provided)
 * @returns Calculated fee amount
 */
export function calculateFee(
  amount: number,
  paymentMethod: PaymentMethod,
  feesConfig?: FeesResponse | null
): number {
  // Fallback fee configuration (used if API fails or not yet loaded)
  const fallbackFees: Record<string, number | ((amount: number) => number)> = {
    VA_BANK: 2500,
    RETAIL: 2500,
    QRIS: (amount: number) => amount * 0.01, // 1%
    EWALLET: (amount: number) => amount * 0.015, // 1.5%
  };

  // Use API fees if available, otherwise use fallback
  if (feesConfig) {
    // Map payment method to API response key
    const methodKeyMap: Record<PaymentMethod, keyof FeesResponse> = {
      VA_BANK: 'va_bank',
      RETAIL: 'retail',
      QRIS: 'qris',
      EWALLET: 'ewallet',
    };

    const methodKey = methodKeyMap[paymentMethod];
    const feeConfig = feesConfig[methodKey];

    if (feeConfig) {
      if (feeConfig.type === 'static') {
        return feeConfig.value;
      } else if (feeConfig.type === 'percentage') {
        return Math.round(amount * feeConfig.value);
      }
    }
  }

  // Fallback to hardcoded fees if API not available
  const fee = fallbackFees[paymentMethod];
  if (typeof fee === 'function') {
    return Math.round(fee(amount));
  }
  return fee || 0;
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

