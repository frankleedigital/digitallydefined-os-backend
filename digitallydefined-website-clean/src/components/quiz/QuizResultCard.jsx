import Badge from '../ui/Badge.jsx';
import Card from '../ui/Card.jsx';

export default function QuizResultCard({ persona, result }) {
  return (
    <Card className="text-center">
      <Badge>{result.confidence ? `${Math.round(result.confidence * 100)}% match` : 'Your archetype'}</Badge>
      <h1 className="mt-4 text-3xl font-bold">{persona.title}</h1>
      <p className="mt-1 text-sm uppercase tracking-wide text-brand-accent">{persona.superpowerName}</p>
      <p className="mt-3 italic text-brand-muted">“{persona.tagline}”</p>
      <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed">{persona.description}</p>

      <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
        <div className="rounded-lg border border-brand-border p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-muted">Recommended first step</h3>
          <p className="mt-2 text-sm">{persona.recommendedFirstStep}</p>
        </div>
        <div className="rounded-lg border border-brand-border p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-muted">Business model</h3>
          <p className="mt-2 text-sm">{persona.businessModel}</p>
        </div>
        <div className="rounded-lg border border-brand-border p-4 sm:col-span-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-muted">Recommended pathways</h3>
          <ul className="mt-2 space-y-1 text-sm text-brand-muted">
            {persona.recommendedPathways.map((p) => <li key={p}>• {p}</li>)}
          </ul>
        </div>
      </div>
    </Card>
  );
}
