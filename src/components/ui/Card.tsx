import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'stat' | 'activity';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-white border border-[#e8eeee]',
      stat: 'bg-white border border-[#e8eeee] rounded-[32px] p-6 lg:p-8',
      activity: 'bg-white border border-[#e8eeee] rounded-[24px] p-5',
    };

    return (
      <div
        className={cn(variants[variant], 'rounded-2xl shadow-sm', className)}
        ref={ref}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div className={cn('flex items-center justify-between mb-6 px-2', className)} ref={ref} {...props} />
  )
);

CardHeader.displayName = 'CardHeader';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div className={cn('px-2', className)} ref={ref} {...props} />
  )
);

CardContent.displayName = 'CardContent';
