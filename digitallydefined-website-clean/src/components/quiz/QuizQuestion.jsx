import Button from '../ui/Button.jsx';

export default function QuizQuestion({ question, selected, onSelect, onNext, onBack, index, total }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-brand-muted">
        Question {index + 1} of {total}
      </p>
      <h2 className="mt-2 text-2xl font-semibold">{question.label}</h2>
      <div className="mt-6 space-y-3">
        {question.options.map((opt) => {
          const active = selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSelect(opt.value)}
              className={`w-full rounded-xl border px-5 py-4 text-left text-sm transition-colors ${
                active
                  ? 'border-brand-accent bg-brand-accent/10 text-brand-text'
                  : 'border-brand-border bg-brand-surface text-brand-muted hover:border-brand-accent/50'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <div className="mt-6 flex justify-between">
        <Button variant="ghost" onClick={onBack} disabled={index === 0}>← Back</Button>
        <Button onClick={onNext} disabled={!selected}>Next →</Button>
      </div>
    </div>
  );
}
