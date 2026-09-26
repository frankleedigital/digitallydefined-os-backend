/**
 * Social proof. White card, thin black frame.
 * Deliberately typographic — no avatars or stock photos, to stay faceless.
 */
export default function Testimonial({ quote, name, detail }) {
  return (
    <figure className="border border-ink bg-white p-6">
      <blockquote className="text-lg text-ink">“{quote}”</blockquote>
      <figcaption className="mt-4 border-t border-ink pt-3">
        <p className="text-sm font-bold uppercase tracking-wide text-ink">{name}</p>
        {detail ? <p className="text-xs uppercase tracking-wide text-slate">{detail}</p> : null}
      </figcaption>
    </figure>
  );
}