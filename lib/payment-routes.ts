import { PaymentMethod } from '@/types/deposit';

/**
 * Mapping path to payment method
 */
export const PAYMENT_ROUTES: Record<string, PaymentMethod> = {
  '/ewallet': 'EWALLET',
  '/e-wallet': 'EWALLET',
  '/vabank': 'VA_BANK',
  '/va-bank': 'VA_BANK',
  '/va': 'VA_BANK',
  '/qris': 'QRIS',
  '/retail': 'RETAIL',
  '/': 'ALL', // Default: show all methods
};

/**
 * Get payment method from path
 */
export function getPaymentMethodFromPath(pathname: string): PaymentMethod {
  // Normalize pathname
  const normalizedPath = pathname.toLowerCase();
  
  // Check exact match first
  if (PAYMENT_ROUTES[normalizedPath]) {
    return PAYMENT_ROUTES[normalizedPath];
  }
  
  // Check if path contains payment method keywords
  if (normalizedPath.includes('ewallet') || normalizedPath.includes('e-wallet')) {
    return 'EWALLET';
  }
  if (normalizedPath.includes('vabank') || normalizedPath.includes('va-bank') || normalizedPath.includes('/va')) {
    return 'VA_BANK';
  }
  if (normalizedPath.includes('qris')) {
    return 'QRIS';
  }
  if (normalizedPath.includes('retail')) {
    return 'RETAIL';
  }
  
  // Default to ALL
  return 'ALL';
}

/**
 * Get path from payment method
 */
export function getPathFromPaymentMethod(method: PaymentMethod): string {
  const entry = Object.entries(PAYMENT_ROUTES).find(
    ([_, value]) => value === method
  );
  return entry ? entry[0] : '/';
}

/**
 * Get page title from payment method
 */
export function getPageTitle(method: PaymentMethod): string {
  const titles: Record<PaymentMethod, string> = {
    EWALLET: 'Deposit via E-Wallet',
    VA_BANK: 'Deposit via Virtual Account',
    QRIS: 'Deposit via QRIS',
    RETAIL: 'Deposit via Retail Outlet',
    ALL: 'Deposit Saldo',
  };
  return titles[method] || 'Deposit Saldo';
}

/**
 * Get page description from payment method
 */
export function getPageDescription(method: PaymentMethod): string {
  const descriptions: Record<PaymentMethod, string> = {
    EWALLET: 'Deposit saldo menggunakan E-Wallet seperti OVO, DANA, ShopeePay, dan lainnya',
    VA_BANK: 'Deposit saldo menggunakan Virtual Account BCA, BNI, BRI, MANDIRI, dan lainnya',
    QRIS: 'Deposit saldo menggunakan QRIS - scan QR code untuk pembayaran',
    RETAIL: 'Deposit saldo melalui gerai retail seperti Alfamart dan Indomaret',
    ALL: 'Deposit saldo dengan berbagai metode pembayaran melalui Xendit',
  };
  return descriptions[method] || 'Deposit saldo dengan berbagai metode pembayaran';
}

