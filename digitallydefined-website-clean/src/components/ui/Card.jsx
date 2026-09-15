import { cn } from '../../lib/cn.js';

export default function Card({ className, children, ...props }) {
  return (
    <div className={cn('rounded-xl border border-brand-border bg-brand-surface p-6', className)} {...props}>
      {children}
    </div>
  );
}
