import { cn } from '../../lib/cn.js';

export default function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'w-full  border border-ink bg-cream px-4 py-2.5 text-sm text-ink placeholder-slate focus:border-orange focus:outline-none',
        className
      )}
      {...props}
    />
  );
}
