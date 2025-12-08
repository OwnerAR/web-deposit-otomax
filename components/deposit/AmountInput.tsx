'use client';

import { forwardRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MIN_AMOUNT, MAX_AMOUNT } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface AmountInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const AmountInput = forwardRef<HTMLInputElement, AmountInputProps>(
  ({ error, value, onFocus, onChange, className, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      // Clear value if it's 0 when user focuses on input
      const currentValue = e.target.value;
      if (currentValue === '0') {
        e.target.value = '';
        // Trigger onChange to update form state
        if (onChange) {
          const syntheticEvent = {
            ...e,
            target: { ...e.target, value: '' },
            currentTarget: { ...e.currentTarget, value: '' },
          } as React.ChangeEvent<HTMLInputElement>;
          onChange(syntheticEvent);
        }
      }
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
    };

    return (
      <div className="space-y-3">
        <Label htmlFor="amount" className="text-sm sm:text-base font-semibold text-gray-900 block">
          Nominal Deposit
        </Label>
        <div className="relative group">
          <span className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-gray-700 font-semibold text-base sm:text-lg z-10 pointer-events-none transition-colors duration-200 group-focus-within:text-primary-600">
            Rp
          </span>
          <Input
            id="amount"
            ref={ref}
            type="number"
            placeholder="100.000"
            className={cn(
              'pl-14 sm:pl-16 pr-4 sm:pr-5',
              'h-12 sm:h-14',
              'text-base sm:text-lg',
              'font-medium',
              'border-2',
              'bg-gray-50/50',
              isFocused 
                ? 'border-primary-500 ring-4 ring-primary-100 shadow-lg bg-white' 
                : 'border-gray-300 hover:border-primary-300 hover:bg-white',
              'transition-all duration-300',
              'focus:bg-white',
              error && 'border-error-500 ring-error-100',
              className
            )}
            min={MIN_AMOUNT}
            max={MAX_AMOUNT}
            step="1000"
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
            onChange={onChange}
          />
        </div>
        {error && (
          <p className="text-sm text-error-600 font-medium mt-1.5 animate-in fade-in slide-in-from-top-1">{error}</p>
        )}
        <p className="text-xs sm:text-sm text-gray-500 font-medium">
          Minimum: <span className="font-semibold text-gray-700">{formatCurrency(MIN_AMOUNT)}</span> | Maximum: <span className="font-semibold text-gray-700">{formatCurrency(MAX_AMOUNT)}</span>
        </p>
      </div>
    );
  }
);

AmountInput.displayName = 'AmountInput';

export default AmountInput;

