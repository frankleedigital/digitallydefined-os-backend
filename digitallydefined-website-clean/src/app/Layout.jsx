import { Link, NavLink } from 'react-router-dom';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/quiz', label: 'Superpower Quiz' },
];

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-brand-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-lg font-bold tracking-tight">
            Digitally<span className="text-brand-accent">Defined</span>
          </Link>
          <nav className="flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-sm ${isActive ? 'bg-brand-surface text-brand-text' : 'text-brand-muted hover:text-brand-text'}`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-brand-border py-6 text-center text-xs text-brand-muted">
        © {new Date().getFullYear()} DigitallyDefined — Discover your Digital Superpower.
      </footer>
    </div>
  );
}
