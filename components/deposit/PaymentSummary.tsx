'use client';

import { Card } from '@/components/ui/card';
import { formatCurrency, calculateFee } from '@/lib/utils';
import { PaymentMethod } from '@/types/deposit';
import { useFeesContext } from '@/contexts/FeesContext';

interface PaymentSummaryProps {
  baseAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
}

export default function PaymentSummary({
  baseAmount,
  totalAmount,
  paymentMethod,
}: PaymentSummaryProps) {
  const { fees: feesConfig } = useFeesContext();
  const fee = calculateFee(baseAmount, paymentMethod, feesConfig);

  return (
    <Card className="p-6 sm:p-7 md:p-8 bg-gradient-to-br from-primary-50 via-primary-50/80 to-blue-50 border-2 border-primary-200/60 shadow-lg">
      <div className="flex items-center gap-2 mb-5 sm:mb-6">
        <div className="w-1 h-8 sm:h-10 bg-gradient-to-b from-primary-500 to-primary-600 rounded-full"></div>
        <h3 className="font-bold text-lg sm:text-xl text-gray-900">Ringkasan Pembayaran</h3>
      </div>
      <div className="space-y-4 sm:space-y-5">
        <div className="flex justify-between items-center py-2">
          <span className="text-sm sm:text-base text-gray-600 font-medium">Nominal Deposit:</span>
          <span className="text-base sm:text-lg font-bold text-gray-900">{formatCurrency(baseAmount)}</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-sm sm:text-base text-gray-600 font-medium">Biaya Admin:</span>
          <span className="text-base sm:text-lg font-bold text-gray-700">{formatCurrency(fee)}</span>
        </div>
        <div className="border-t-2 border-primary-300/60 pt-4 sm:pt-5 mt-3 sm:mt-4 flex justify-between items-center bg-white/40 rounded-lg px-4 sm:px-5 py-3 sm:py-4">
          <span className="text-base sm:text-lg font-bold text-gray-900">Total Pembayaran:</span>
          <span className="text-xl sm:text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
            {formatCurrency(totalAmount)}
          </span>
        </div>
      </div>
    </Card>
  );
}

