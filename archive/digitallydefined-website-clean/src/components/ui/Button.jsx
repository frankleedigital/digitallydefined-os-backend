import { cn } from '../../lib/cn.js';

export default function Button({ as: Tag = 'button', variant = 'primary', className, children, ...props }) {
  // Squared edges, thin black frames, no shadows — soft brutalism.
  const base = 'inline-flex items-center justify-center px-5 py-2.5 text-sm font-bold uppercase tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-orange text-white border border-ink hover:bg-ink hover:text-white',
    outline: 'bg-white text-ink border border-ink hover:bg-ink hover:text-white',
    ghost: 'bg-transparent text-ink border border-transparent hover:border-ink',
    danger: 'bg-danger text-white border border-ink hover:bg-ink hover:text-white',
  };
  return <Tag className={cn(base, variants[variant], className)} {...props}>{children}</Tag>;
}