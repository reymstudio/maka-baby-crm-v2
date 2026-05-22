import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';
    
    const variants = {
      primary: 'bg-[#8B4E47] text-white hover:bg-[#7a423d] focus:ring-[#8B4E47]',
      secondary: 'bg-[#e4eadf] text-[#31332E] hover:bg-[#d5dccf] focus:ring-[#e4eadf]',
      ghost: 'bg-transparent text-[#8B4E47] hover:bg-[#f5f0ef] focus:ring-[#8B4E47]',
      danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
    };
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm h-9',
      md: 'px-4 py-2.5 text-sm h-11',
      lg: 'px-6 py-3 text-base h-12',
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
