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
    <Card className="p-4 md:p-5 bg-gradient-to-br from-primary-50 to-primary-100/50 border-primary-200">
      <h3 className="font-bold text-base md:text-lg mb-4 text-gray-900">Ringkasan Pembayaran</h3>
      <div className="space-y-3 text-sm md:text-base">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Nominal Deposit:</span>
          <span className="font-semibold text-gray-900">{formatCurrency(baseAmount)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Biaya Admin:</span>
          <span className="font-semibold text-gray-700">{formatCurrency(fee)}</span>
        </div>
        <div className="border-t-2 border-primary-200 pt-3 mt-2 flex justify-between items-center">
          <span className="font-bold text-gray-900">Total Pembayaran:</span>
          <span className="font-bold text-lg md:text-xl text-primary-600">{formatCurrency(totalAmount)}</span>
        </div>
      </div>
    </Card>
  );
}

