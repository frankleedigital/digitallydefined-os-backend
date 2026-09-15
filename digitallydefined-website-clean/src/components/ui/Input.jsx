import { cn } from '../../lib/cn.js';

export default function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'w-full rounded-lg border border-brand-border bg-brand-bg px-4 py-2.5 text-sm text-brand-text placeholder-brand-muted focus:border-brand-accent focus:outline-none',
        className
      )}
      {...props}
    />
  );
}
