import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Input from '../../components/ui/Input.jsx';
import { SESSION_KEY, saveSession } from '../../lib/session.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email.');
      return;
    }
    saveSession({ email: email.trim() });
    navigate('/dashboard/app');
  }

  return (
    <div className="container-page py-20">
      <Card className="mx-auto max-w-md">
        <h1 className="text-2xl font-bold">Enter the dashboard</h1>
        <p className="mt-2 text-sm text-brand-muted">
          Sign in with the email you used for the quiz to load your personalized roadmap.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <Button type="submit" className="w-full">Continue →</Button>
        </form>
        <p className="mt-4 text-xs text-brand-muted">
          No roadmap yet? <Link to="/quiz" className="text-brand-accent hover:underline">Take the quiz</Link> first.
        </p>
      </Card>
    </div>
  );
}
