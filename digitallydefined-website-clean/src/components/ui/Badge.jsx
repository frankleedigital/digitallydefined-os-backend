import { cn } from '../../lib/cn.js';

export default function Badge({ className, children }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border border-brand-border bg-brand-surface px-3 py-1 text-xs font-medium text-brand-muted', className)}>
      {children}
    </span>
  );
}
