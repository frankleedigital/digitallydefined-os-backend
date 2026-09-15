import { useParams, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { callAgent } from '../../lib/api.js';

const AGENT_CONFIG = {
  niche:     { title: 'Niche Agent',     fields: [{ name: 'topic', label: 'Topic', placeholder: 'e.g. AI tools for solo developers' }] },
  roadmap:   { title: 'Roadmap Agent',   fields: [{ name: 'niche', label: 'Niche', placeholder: 'e.g. indie SaaS' }] },
  scorecard: { title: 'Scorecard Agent', fields: [{ name: 'niche', label: 'Niche', placeholder: 'e.g. online education' }] },
  product:   { title: 'Product Agent',   fields: [{ name: 'niche', label: 'Niche', placeholder: 'e.g. fitness creators' }] },
  social:    { title: 'Social Agent',    fields: [{ name: 'niche', label: 'Niche', placeholder: 'e.g. faceless YouTube' }] },
  trends:    { title: 'Trends Agent',    fields: [{ name: 'niche', label: 'Niche', placeholder: 'e.g. AI automation' }] },
};

const MODES = ['freeMode', 'proMode', 'ultraMode'];

export default function AgentPage() {
  const { agent } = useParams();
  const meta = AGENT_CONFIG[agent];
  const [values, setValues] = useState({});
  const [mode, setMode] = useState('freeMode');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!meta) return <Navigate to="/dashboard/app" replace />;

  async function run(e) {
    e.preventDefault();
    setLoading(true); setError(null); setResult(null);
    try {
      const data = await callAgent(agent, values, mode);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Agent call failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page max-w-3xl">
      <h1 className="text-2xl font-bold">{meta.title}</h1>
      <Card className="mt-6">
        <form onSubmit={run} className="space-y-4">
          {meta.fields.map((f) => (
            <div key={f.name}>
              <label className="mb-1 block text-xs font-medium text-brand-muted">{f.label}</label>
              <input
                className="w-full rounded-lg border border-brand-border bg-brand-bg px-4 py-2.5 text-sm placeholder-brand-muted focus:border-brand-accent focus:outline-none"
                placeholder={f.placeholder}
                value={values[f.name] || ''}
                onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                required
              />
            </div>
          ))}
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-brand-muted">Model mode</label>
            <select
              className="rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-sm"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <Button type="submit" disabled={loading} className="ml-auto">
              {loading ? <Spinner className="h-4 w-4" /> : 'Run agent'}
            </Button>
          </div>
        </form>
      </Card>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {result && (
        <Card className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-muted">Result</h2>
            <span className="text-xs text-brand-muted">{result.provider ? `${result.provider} · ${result.model}` : ''}</span>
          </div>
          <pre className="max-h-[28rem] overflow-auto rounded-lg bg-brand-bg p-4 text-xs leading-relaxed">
            {JSON.stringify(result, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}
