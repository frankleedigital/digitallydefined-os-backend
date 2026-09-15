import { cn } from '../../lib/cn.js';

export default function QuizProgress({ current, total }) {
  const pct = Math.round(((current + 1) / total) * 100);
  return (
    <div className="mb-8">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-border">
        <div className="h-full rounded-full bg-brand-accent transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className={cn('mt-2 text-right text-xs text-brand-muted')}>{pct}% complete</p>
    </div>
  );
}
