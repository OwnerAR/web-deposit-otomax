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
      <div className="space-y-3">
        <Label htmlFor="payment_method" className="text-sm sm:text-base font-semibold text-gray-900 block">
          Metode Pembayaran
        </Label>
        <Select value={value} onValueChange={handleValueChange}>
          <SelectTrigger 
            id="payment_method" 
            ref={ref} 
            className="h-12 sm:h-14 text-base sm:text-lg bg-gray-50/50 border-2 border-gray-300 hover:border-primary-300 hover:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-300"
            {...props}
          >
            <SelectValue placeholder="Pilih metode pembayaran" />
          </SelectTrigger>
          <SelectContent className="bg-white border-2 border-gray-200 shadow-xl">
            {PAYMENT_METHODS.map((method) => {
              const IconComponent = method.icon;
              return (
                <SelectItem 
                  key={method.value} 
                  value={method.value}
                  className="h-12 sm:h-14 text-base cursor-pointer hover:bg-primary-50 focus:bg-primary-50 transition-colors duration-200"
                >
                  <div className="flex items-center gap-3 w-full">
                    <IconComponent className="w-5 h-5 text-primary-600 flex-shrink-0" />
                    <div className="flex flex-col text-left flex-1">
                      <span className="font-semibold text-base">{method.label}</span>
                      <span className="text-xs text-gray-500 mt-0.5">{method.description}</span>
                    </div>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        {error && (
          <p className="text-sm text-error-600 font-medium mt-1.5 animate-in fade-in slide-in-from-top-1">{error}</p>
        )}
      </div>
    );
  }
);

PaymentMethodSelect.displayName = 'PaymentMethodSelect';

export default PaymentMethodSelect;

