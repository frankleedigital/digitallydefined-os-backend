/**
 * A single value proposition. White card, thin black frame, squared edges.
 * `title` doubles as the frame's heading — no icons, no emoji.
 */
export default function Feature({ title, description }) {
  return (
    <article className="border border-ink bg-white p-6">
      <h3 className="text-lg uppercase">{title}</h3>
      <p className="mt-3 text-slate">{description}</p>
    </article>
  );
}