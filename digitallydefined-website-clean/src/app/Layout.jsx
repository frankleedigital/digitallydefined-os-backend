import { Link, NavLink } from 'react-router-dom';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/quiz', label: 'Superpower Quiz' },
];

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-brand-cream">
      <header className="border-b-2 border-brand-ink bg-brand-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-heading font-black tracking-tight text-brand-ink">
            Digitally<span className="text-brand-orange">Defined</span>
          </Link>
          <nav className="flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `rounded-none border-2 px-3 py-1.5 text-sm font-heading font-semibold transition-all ${
                    isActive
                      ? 'border-brand-ink bg-brand-cream text-brand-ink'
                      : 'border-transparent text-brand-muted hover:border-brand-ink hover:bg-brand-cream hover:text-brand-ink'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="min-h-[80vh]">{children}</main>
      <footer className="border-t-2 border-brand-ink bg-brand-white py-6">
        <p className="text-center text-xs text-brand-muted">
          © {new Date().getFullYear()} DigitallyDefined — Discover your Digital Superpower.
        </p>
      </footer>
    </div>
  );
}
