import { Link } from 'react-router-dom';

const FACEBOOK_GROUP_URL = 'https://www.facebook.com/groups/digitallydefind';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FFFCF9] flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-neutral-900 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="text-sm font-semibold tracking-tight">
            DigitallyDefined
          </div>
        </div>
      </header>

      {/* Centered hero */}
      <section className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <p className="text-xs uppercase tracking-[0.25em] text-neutral-700">
            Faceless digital real estate
          </p>

          <h1 className="text-3xl md:text-4xl font-extrabold text-neutral-900">
            Faceless Digital Real Estate for Gen X Women
          </h1>

          <p className="text-base md:text-lg text-neutral-800">
            Discover your Digital Superpower and get your personalized roadmap.
          </p>

          <p className="text-sm md:text-base text-neutral-600">
            Build digital assets quietly, intentionally, and without becoming the brand.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              to="/quiz"
              className="px-5 py-3 text-sm font-medium bg-neutral-900 text-[#FFFCF9] border border-neutral-900"
            >
              Take the Quiz
            </Link>
            <a
              href={FACEBOOK_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 text-sm font-medium border border-neutral-900 text-neutral-900 bg-transparent"
            >
              Join the Community
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-neutral-900 px-6 py-4">
        <div className="max-w-4xl mx-auto text-center text-xs text-neutral-600">
          © {new Date().getFullYear()} DigitallyDefined. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
