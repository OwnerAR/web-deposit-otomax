import { PaymentMethod } from '@/types/deposit';
import { CreditCard, Smartphone, QrCode, Wallet, LucideIcon } from 'lucide-react';

export const PAYMENT_METHODS: Array<{
  value: PaymentMethod;
  label: string;
  icon: LucideIcon;
  description: string;
}> = [
  {
    value: 'VA_BANK',
    label: 'Virtual Account',
    icon: CreditCard,
    description: 'BCA, BNI, BRI, MANDIRI, dll',
  },
  {
    value: 'RETAIL',
    label: 'Retail Outlet',
    icon: Smartphone,
    description: 'Alfamart, Indomaret',
  },
  {
    value: 'QRIS',
    label: 'QRIS',
    icon: QrCode,
    description: 'Scan QR Code',
  },
  {
    value: 'EWALLET',
    label: 'E-Wallet',
    icon: Wallet,
    description: 'OVO, DANA, ShopeePay, dll',
  },
  {
    value: 'ALL',
    label: 'Semua Metode',
    icon: CreditCard,
    description: 'Buat semua metode pembayaran',
  },
];

// Get min/max amount from environment variables with fallback defaults
export const MIN_AMOUNT = parseInt(
  process.env.NEXT_PUBLIC_MIN_DEPOSIT_AMOUNT || '10000',
  10
);

export const MAX_AMOUNT = parseInt(
  process.env.NEXT_PUBLIC_MAX_DEPOSIT_AMOUNT || '100000000',
  10
);

