import { Link, useLocation, Navigate } from 'react-router-dom';
import Button from '../../components/ui/Button.jsx';
import QuizResultCard from '../../components/quiz/QuizResultCard.jsx';
import Card from '../../components/ui/Card.jsx';
import { getPersona } from '../../lib/quiz/personas.js';

export default function QuizResultsPage() {
  const location = useLocation();
  const state = location.state;

  if (!state?.personaKey) return <Navigate to="/quiz" replace />;

  const persona = getPersona(state.personaKey);
  const result = state.result || {};
  const roadmap = result.roadmap || null;

  return (
    <div className="container-page py-12">
      <QuizResultCard persona={persona} result={{ confidence: state.confidence }} />

      {roadmap && (
        <Card className="mt-6">
          <h2 className="text-lg font-semibold">Your personalized roadmap</h2>
          {Array.isArray(roadmap.steps) && roadmap.steps.length > 0 ? (
            <ol className="mt-4 space-y-3 text-sm">
              {roadmap.steps.map((s, i) => (
                <li key={i} className="rounded-lg border border-brand-border p-3">
                  <span className="font-semibold">{i + 1}. {s.title || s.step || s.name || 'Step'}</span>
                  {s.description && <p className="mt-1 text-brand-muted">{s.description}</p>}
                </li>
              ))}
            </ol>
          ) : (
            <pre className="mt-4 overflow-x-auto rounded-lg bg-brand-bg p-4 text-xs text-brand-muted">
              {JSON.stringify(roadmap, null, 2)}
            </pre>
          )}
        </Card>
      )}

      <div className="mt-8 flex justify-center gap-3">
        <Button as={Link} to="/quiz/inbox" state={{ email: state.email }}>Check your inbox →</Button>
        <Button as={Link} to="/" variant="outline">Back home</Button>
      </div>
    </div>
  );
}
