import { cn } from '../../lib/cn.js';

export default function QuizProgress({ current, total }) {
  const pct = Math.round(((current + 1) / total) * 100);
  return (
    <div className="mb-8">
      <div className="h-1.5 w-full border border-ink bg-white">
        <div className="h-full  bg-orange transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className={cn('mt-2 text-right text-xs text-slate')}>{pct}% complete</p>
    </div>
  );
}
