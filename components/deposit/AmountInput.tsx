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
      <div className="space-y-2 md:space-y-2.5">
        <Label htmlFor="amount" className="text-sm md:text-base font-semibold text-gray-900">
          Nominal Deposit
        </Label>
        <div className="relative">
          <span className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-gray-600 font-semibold text-base md:text-lg z-10 pointer-events-none">
            Rp
          </span>
          <Input
            id="amount"
            ref={ref}
            type="number"
            placeholder="100000"
            className={cn(
              'pl-12 md:pl-14 pr-4 md:pr-5',
              'h-12 md:h-14',
              'text-base md:text-lg',
              'font-normal',
              'border-2',
              isFocused 
                ? 'border-primary-500 ring-2 ring-primary-200 shadow-sm' 
                : 'border-gray-300 hover:border-gray-400',
              'transition-all duration-200',
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
          <p className="text-sm text-error-600 font-medium mt-1">{error}</p>
        )}
        <p className="text-xs md:text-sm text-gray-500 font-medium">
          Minimum: {formatCurrency(MIN_AMOUNT)} | Maximum: {formatCurrency(MAX_AMOUNT)}
        </p>
      </div>
    );
  }
);

AmountInput.displayName = 'AmountInput';

export default AmountInput;

