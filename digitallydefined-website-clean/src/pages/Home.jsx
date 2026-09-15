import { Link } from 'react-router-dom';

const FACEBOOK_GROUP_URL = 'https://www.facebook.com/groups/digitallydefind';

export default function Home() {
  return (
    <div className="min-h-screen bg-brand-cream">
      {/* Header */}
      <header className="border-b-2 border-brand-ink bg-brand-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-heading font-black tracking-tight text-brand-ink">
            Digitally<span className="text-brand-orange">Defined</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              to="/quiz"
              className="rounded-none border-2 border-transparent px-3 py-1.5 text-sm font-heading font-semibold text-brand-ink transition-all hover:border-brand-ink hover:bg-brand-cream"
            >
              Superpower Quiz
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <section className="hero-section">
          <div className="hero-content">
            <span className="label">For Gen X Women</span>
            <h1 className="hero-title mt-4">
              Faceless Digital Real Estate for Gen X Women
            </h1>
            <p className="hero-subtitle mt-6">
              Discover your Digital Superpower and get your personalized roadmap.
            </p>
            <p className="mt-4 text-base text-brand-muted">
              Build digital assets quietly, intentionally, and without becoming the brand.
            </p>
            <div className="cta-group mt-10">
              <Link to="/quiz" className="btn btn-primary shadow-hard hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
                Take the Quiz
              </Link>
              <a
                href={FACEBOOK_GROUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline shadow-hard hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
              >
                Join the Community
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-brand-ink bg-brand-white py-6">
        <p className="text-center text-xs text-brand-muted">
          © {new Date().getFullYear()} DigitallyDefined — Discover your Digital Superpower.
        </p>
      </footer>
    </div>
  );
}
