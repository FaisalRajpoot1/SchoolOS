import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

/** Labeled native select that forwards refs for react-hook-form. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, id, className, children, ...props }, ref) => {
    const selectId = id ?? props.name;
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={cn(
            'w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-brand-500/20',
            error ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-brand-500',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  },
);

Select.displayName = 'Select';
