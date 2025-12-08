'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

export interface SelectContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextValue>({
  isOpen: false,
  setIsOpen: () => {},
});

export function Select({ value, onValueChange, children }: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
}

export interface SelectTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  SelectTriggerProps
>(({ className, children, onClick, ...props }, ref) => {
  const context = React.useContext(SelectContext);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    context.setIsOpen(!context.isOpen);
    onClick?.(e);
  };

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        'flex h-12 sm:h-14 w-full items-center justify-between rounded-lg border-2 border-gray-300 bg-gray-50/50 px-4 sm:px-5 py-2.5 text-base sm:text-lg font-medium transition-all duration-300 placeholder:text-gray-400 hover:border-primary-300 hover:bg-white focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
});
SelectTrigger.displayName = 'SelectTrigger';

export interface SelectValueProps {
  placeholder?: string;
}

export function SelectValue({ placeholder }: SelectValueProps) {
  const context = React.useContext(SelectContext);
  return (
    <span className={cn(!context.value && 'text-gray-500')}>
      {context.value || placeholder}
    </span>
  );
}

export interface SelectContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function SelectContent({ className, children, ...props }: SelectContentProps) {
  const context = React.useContext(SelectContext);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target as Node)
      ) {
        context.setIsOpen(false);
      }
    };

    if (context.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [context.isOpen, context]);

  if (!context.isOpen) return null;

  return (
    <div
      ref={contentRef}
      className={cn(
        'absolute z-50 mt-2 max-h-80 w-full overflow-auto rounded-xl border-2 border-gray-200 bg-white shadow-2xl backdrop-blur-sm',
        className
      )}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            onSelect: (value: string) => {
              context.onValueChange?.(value);
              context.setIsOpen(false);
            },
          } as any);
        }
        return child;
      })}
    </div>
  );
}

export interface SelectItemProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  value: string;
  onSelect?: (value: string) => void;
}

export function SelectItem({
  className,
  value,
  children,
  onSelect,
  ...props
}: SelectItemProps) {
  const context = React.useContext(SelectContext);
  const isSelected = context.value === value;

  return (
    <div
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-lg px-4 sm:px-5 py-3 sm:py-4 text-base outline-none hover:bg-primary-50 focus:bg-primary-50 transition-all duration-200',
        isSelected && 'bg-primary-100 border-l-4 border-primary-500',
        className
      )}
      onClick={() => onSelect?.(value)}
      {...props}
    >
      {children}
    </div>
  );
}

