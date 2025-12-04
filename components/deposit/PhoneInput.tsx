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
    <div className="space-y-2 md:space-y-2.5">
      <Label htmlFor="phone_number">Nomor Telepon (Opsional)</Label>
      <Input
        id="phone_number"
        ref={ref}
        type="tel"
        placeholder="081234567890"
        {...props}
      />
      {error && (
        <p className="text-sm text-error-600 font-medium">{error}</p>
      )}
      <p className="text-xs md:text-sm text-gray-500">
        Format: 08XXXXXXXXXX (10-12 digit)
      </p>
    </div>
  );
  }
);

PhoneInput.displayName = 'PhoneInput';

export default PhoneInput;

