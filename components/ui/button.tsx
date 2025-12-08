import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    // Extract className to separate base classes from custom overrides
    const baseClasses = 'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]';
    
    const variantClasses = {
      default: '!bg-[#2563EB] !text-white hover:!bg-[#1D4ED8] active:!bg-[#1E40AF] shadow-lg hover:shadow-xl transform hover:scale-[1.02]',
      outline: 'border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-primary-300 hover:shadow-md',
      ghost: 'text-gray-700 hover:bg-gray-100 hover:shadow-sm',
    };
    
    const sizeClasses = {
      default: 'h-11 px-5 py-2.5 text-sm sm:text-base',
      sm: 'h-9 px-4 text-sm',
      lg: 'h-14 sm:h-16 px-8 sm:px-10 text-base sm:text-lg',
    };

    // For default variant, ensure colors are applied with inline style as fallback
    const defaultStyle = variant === 'default' 
      ? { 
          backgroundColor: '#2563EB', 
          color: '#FFFFFF',
        }
      : undefined;

    return (
      <button
        className={cn(
          baseClasses,
          sizeClasses[size],
          className, // Custom className first
          variantClasses[variant], // Variant classes last to ensure they override
        )}
        style={defaultStyle}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };

