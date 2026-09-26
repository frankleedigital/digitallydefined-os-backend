import { useLocation, Link } from 'react-router-dom';
import Button from '../../components/ui/Button.jsx';

export default function InboxPage() {
  const email = useLocation()?.state?.email;
  return (
    <div className="container-page py-20 text-center">
      <div className="mx-auto max-w-md">
        <div className="mx-auto flex h-14 w-14 items-center justify-center  bg-orange/15 text-2xl">✉️</div>
        <h1 className="mt-6 text-3xl font-bold">Check your inbox</h1>
        <p className="mt-3 text-sm text-slate">
          {email
            ? <>We sent your personalized roadmap to <span className="text-ink">{email}</span>.</>
            : 'We sent your personalized roadmap to your email.'}
          {' '}It includes your superpower type, the next 3 steps, and the tool we recommend for your archetype.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button as={Link} to="/quiz" variant="ghost">Retake the quiz</Button>
        </div>
        <p className="mt-6 text-xs text-slate">Didn&apos;t get it? Check spam, or give it a minute.</p>
      </div>
    </div>
  );
}
