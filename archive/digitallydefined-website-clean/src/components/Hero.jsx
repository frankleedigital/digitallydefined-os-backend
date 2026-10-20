import Button from './ui/Button.jsx';

/**
 * Homepage hero. White card, thin black frame, squared edges.
 * `eyebrow` carries the brand orange accent; the CTA is the primary conversion.
 */
export default function Hero({
  eyebrow = 'Faceless Digital Real Estate',
  title,
  subtitle,
  buttonText = 'Take the Quiz',
  buttonLink = '/quiz',
  secondaryText,
  secondaryLink = '/quiz',
}) {
  return (
    <section className="border border-ink bg-white">
      <div className="grid gap-0 md:grid-cols-2">
        <div className="border-b border-ink p-8 sm:p-12 md:border-b-0 md:border-r">
          <p className="mb-4 inline-block border border-ink bg-orange px-3 py-1 text-xs font-bold uppercase tracking-wide text-ink">
            {eyebrow}
          </p>
          <h1 className="text-4xl uppercase sm:text-5xl">{title}</h1>
          {subtitle ? <p className="mt-4 text-lg text-slate">{subtitle}</p> : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <Button as="a" href={buttonLink} variant="primary">
              {buttonText}
            </Button>
            {secondaryText ? (
              <Button as="a" href={secondaryLink} variant="outline">
                {secondaryText}
              </Button>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col justify-center gap-4 bg-cream p-8 sm:p-12">
          <p className="text-xs font-bold uppercase tracking-widest text-slate">How it works</p>
          <ol className="space-y-4">
            {[
              'Take the two-minute Digital Superpower Quiz.',
              'Get your personalized roadmap built around your strengths.',
              'Follow the plan with zero need to show your face.',
            ].map((step, i) => (
              <li key={step} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-ink bg-white font-heading text-sm font-bold">
                  {i + 1}
                </span>
                <span className="text-slate">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}