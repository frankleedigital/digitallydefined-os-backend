import { Link, Navigate } from 'react-router-dom';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import { getSession, clearSession } from '../../lib/session.js';
import { fetchRoadmap } from '../../lib/api.js';
import { useEffect, useState } from 'react';

const AGENTS = [
  { key: 'niche',     name: 'Niche',      description: 'Analyze a niche: demand, competition, monetization potential.' },
  { key: 'roadmap',   name: 'Roadmap',    description: 'Generate a phased strategic roadmap with milestones.' },
  { key: 'scorecard', name: 'Scorecard',  description: 'Score a business across demand, monetization, risk and more.' },
  { key: 'product',   name: 'Product',    description: 'Design a product concept with pricing and launch strategy.' },
  { key: 'social',    name: 'Social',     description: 'Create platform-optimized social content.' },
  { key: 'trends',    name: 'Trends',     description: 'Identify trending topics and emerging opportunities.' },
];

export default function DashboardPage() {
  const session = getSession();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session?.email) return;
    setLoading(true);
    fetchRoadmap(session.email)
      .then((data) => setRoadmap(data?.roadmap || data?.data?.roadmap || null))
      .catch(() => setRoadmap(null))
      .finally(() => setLoading(false));
  }, [session?.email]);

  if (!session) return <Navigate to="/dashboard" replace />;

  return (
    <div className="container-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-brand-muted">Signed in as {session.email}</p>
        </div>
        <Button variant="ghost" onClick={() => { clearSession(); window.location.href = '/dashboard'; }}>Sign out</Button>
      </div>

      {session.email && (
        <Card className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-muted">Your personalized roadmap</h2>
          {loading && <p className="mt-3 text-sm text-brand-muted">Loading…</p>}
          {!loading && roadmap == null && <p className="mt-3 text-sm text-brand-muted">No roadmap stored yet for this email.</p>}
          {!loading && roadmap && (
            <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-brand-bg p-4 text-xs text-brand-muted">
              {JSON.stringify(roadmap, null, 2)}
            </pre>
          )}
        </Card>
      )}

      <h2 className="mt-10 text-lg font-semibold">Agents</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AGENTS.map((a) => (
          <Card key={a.key} className="flex flex-col">
            <h3 className="font-semibold">{a.name}</h3>
            <p className="mt-2 flex-1 text-sm text-brand-muted">{a.description}</p>
            <Button as={Link} to={`/dashboard/app/${a.key}`} variant="outline" className="mt-4 self-start">Open →</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
