'use client';

import { forwardRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { PaymentMethod } from '@/types/deposit';
import { PAYMENT_METHODS } from '@/lib/constants';

interface PaymentMethodSelectProps {
  error?: string;
  value?: PaymentMethod;
  onChange?: (value: PaymentMethod) => void;
}

const PaymentMethodSelect = forwardRef<HTMLButtonElement, PaymentMethodSelectProps>(
  ({ error, value, onChange, ...props }, ref) => {
    const handleValueChange = (newValue: string) => {
      onChange?.(newValue as PaymentMethod);
    };

    return (
      <div className="space-y-2 md:space-y-2.5">
        <Label htmlFor="payment_method">Metode Pembayaran</Label>
        <Select value={value} onValueChange={handleValueChange}>
          <SelectTrigger id="payment_method" ref={ref} {...props}>
            <SelectValue placeholder="Pilih metode pembayaran" />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_METHODS.map((method) => {
              const IconComponent = method.icon;
              return (
                <SelectItem key={method.value} value={method.value}>
                  <div className="flex items-center gap-2">
                    <IconComponent className="w-4 h-4" />
                    <span>{method.label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        {error && (
          <p className="text-sm text-error-600 font-medium">{error}</p>
        )}
      </div>
    );
  }
);

PaymentMethodSelect.displayName = 'PaymentMethodSelect';

export default PaymentMethodSelect;

