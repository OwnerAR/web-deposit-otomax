import { z } from 'zod';
import { MIN_AMOUNT, MAX_AMOUNT } from './constants';
import { formatCurrency } from './utils';

// Create error messages with formatted currency
const MIN_AMOUNT_ERROR = `Minimum deposit adalah ${formatCurrency(MIN_AMOUNT)}`;
const MAX_AMOUNT_ERROR = `Maximum deposit adalah ${formatCurrency(MAX_AMOUNT)}`;

export const depositFormSchema = z.object({
  amount: z
    .preprocess(
      (val) => {
        if (val === '' || val === null || val === undefined) return undefined;
        const num = typeof val === 'string' ? parseFloat(val) : (typeof val === 'number' ? val : undefined);
        if (num === undefined || isNaN(num)) return undefined;
        return num;
      },
      z
        .number({
          required_error: 'Nominal deposit harus diisi',
          invalid_type_error: 'Nominal deposit harus berupa angka',
        })
        .min(MIN_AMOUNT, MIN_AMOUNT_ERROR)
        .max(MAX_AMOUNT, MAX_AMOUNT_ERROR)
        .refine((val) => val > 0, 'Amount harus lebih dari 0')
    ),
  phone_number: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^08\d{9,11}$/.test(val),
      'Format nomor telepon tidak valid (contoh: 081234567890)'
    ),
  payment_method: z.enum(['VA_BANK', 'RETAIL', 'QRIS', 'EWALLET', 'ALL'], {
    required_error: 'Pilih metode pembayaran',
  }),
});

export type DepositFormData = z.infer<typeof depositFormSchema>;

