import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="text-[10px] font-bold text-muted uppercase ml-1">
            {label}
          </label>
        )}
        <input
          className={cn(
            'form-control py-2.5',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-200',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-xs text-red-500 ml-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
