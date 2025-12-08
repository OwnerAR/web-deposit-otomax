'use client';

import { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PhoneInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ error, ...props }, ref) => {
  return (
    <div className="space-y-3">
      <Label htmlFor="phone_number" className="text-sm sm:text-base font-semibold text-gray-900 block">
        Nomor Telepon <span className="text-gray-500 font-normal">(Opsional)</span>
      </Label>
      <Input
        id="phone_number"
        ref={ref}
        type="tel"
        placeholder="081234567890"
        className="h-12 sm:h-14 text-base sm:text-lg bg-gray-50/50 border-2 border-gray-300 hover:border-primary-300 hover:bg-white focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-300"
        {...props}
      />
      {error && (
        <p className="text-sm text-error-600 font-medium mt-1.5 animate-in fade-in slide-in-from-top-1">{error}</p>
      )}
      <p className="text-xs sm:text-sm text-gray-500 font-medium">
        Format: <span className="font-mono font-semibold text-gray-700">08XXXXXXXXXX</span> (10-12 digit)
      </p>
    </div>
  );
  }
);

PhoneInput.displayName = 'PhoneInput';

export default PhoneInput;

