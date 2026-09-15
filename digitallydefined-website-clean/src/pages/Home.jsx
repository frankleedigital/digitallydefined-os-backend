import { Link } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';

// Facebook Community Group
const FACEBOOK_GROUP_URL = 'https://www.facebook.com/groups/digitallydefind';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-brand-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-lg font-bold tracking-tight">
            Digitally<span className="text-brand-accent">Defined</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              to="/quiz"
              className="rounded-lg px-3 py-1.5 text-sm text-brand-muted hover:text-brand-text"
            >
              Superpower Quiz
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="flex min-h-[80vh] items-center justify-center px-4 py-16">
          <div className="text-center">
            <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
              Faceless Digital Real Estate for Gen X Women
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-brand-muted">
              Discover your Digital Superpower and get your personalized roadmap.
            </p>
            <div className="mt-8 flex justify-center gap-3 flex-wrap">
              <Button as={Link} to="/quiz">Take the Quiz</Button>
              <Button as="a" href={FACEBOOK_GROUP_URL} variant="outline" target="_blank" rel="noopener noreferrer">
                Join the Community
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-brand-border py-6 text-center text-xs text-brand-muted">
        © {new Date().getFullYear()} DigitallyDefined — Discover your Digital Superpower.
      </footer>
    </div>
  );
}
