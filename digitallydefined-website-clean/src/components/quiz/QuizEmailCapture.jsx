import { useState } from 'react';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function QuizEmailCapture({ onSubmit, submitting, error }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);

  const valid = EMAIL_RE.test(email);

  function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    onSubmit({ name: name.trim(), email: email.trim() });
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md text-center">
      <h2 className="text-2xl font-semibold">Where should we send your roadmap?</h2>
      <p className="mt-2 text-sm text-brand-muted">
        We will email your personalized roadmap, your next 3 steps, and the tool
        we recommend for your superpower type.
      </p>
      <div className="mt-6 space-y-3 text-left">
        <Input placeholder="First name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {touched && !valid && (
          <p className="text-xs text-red-400">Please enter a valid email address.</p>
        )}
      </div>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      <Button type="submit" className="mt-6 w-full" disabled={submitting || (touched && !valid)}>
        {submitting ? 'Generating your roadmap…' : 'Get my personalized roadmap →'}
      </Button>
    </form>
  );
}
