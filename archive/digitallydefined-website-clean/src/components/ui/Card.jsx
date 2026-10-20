import { cn } from '../../lib/cn.js';

export default function Card({ className, children, ...props }) {
  return (
    <div className={cn('border border-ink bg-white p-6', className)} {...props}>
      {children}
    </div>
  );
}
