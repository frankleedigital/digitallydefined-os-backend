import { Link, NavLink } from 'react-router-dom';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/quiz', label: 'Superpower Quiz' },
];

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-ink bg-white">
        <div className="mx-auto flex max-w-container items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="font-heading text-lg font-extrabold uppercase tracking-tight text-ink">
            Digitally<span className="text-orange">Defined</span>
          </Link>
          <nav className="flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `border px-3 py-1.5 text-sm font-bold uppercase tracking-wide transition-colors ${
                    isActive
                      ? 'border-ink bg-ink text-white'
                      : 'border-transparent text-ink hover:border-ink'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto w-full max-w-container px-4 sm:px-6">{children}</div>
      </main>
      <footer className="border-t border-ink bg-white py-6 text-center text-xs uppercase tracking-wide text-slate">
        © {new Date().getFullYear()} DigitallyDefined — Discover your Digital Superpower.
      </footer>
    </div>
  );
}
