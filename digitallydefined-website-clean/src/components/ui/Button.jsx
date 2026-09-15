import { cn } from '../../lib/cn.js';

export default function Button({ as: Tag = 'button', variant = 'primary', className, children, ...props }) {
  const base = 'inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-brand-accent text-white hover:bg-brand-accent-hover',
    ghost: 'text-brand-text hover:bg-brand-surface',
    outline: 'border border-brand-border text-brand-text hover:border-brand-accent',
  };
  return <Tag className={cn(base, variants[variant], className)} {...props}>{children}</Tag>;
}
