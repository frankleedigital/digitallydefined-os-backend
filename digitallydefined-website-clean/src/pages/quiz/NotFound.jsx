import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-3 text-brand-muted">That page does not exist.</p>
      <Link to="/" className="mt-6 inline-block text-sm text-brand-accent hover:underline">← Back home</Link>
    </div>
  );
}
