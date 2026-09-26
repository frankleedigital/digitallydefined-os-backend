import { cn } from '../../lib/cn.js';

export default function Badge({ className, children }) {
  return (
    <span className={cn('inline-flex items-center border border-ink bg-orange-soft px-3 py-1 text-xs font-bold uppercase tracking-wide text-ink', className)}>
      {children}
    </span>
  );
}
