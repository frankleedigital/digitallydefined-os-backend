import Button from './ui/Button.jsx';

/**
 * Closing call to action. Inverted ink panel so it reads as the final beat
 * without introducing a second accent colour.
 */
export default function CTA({ title, body, buttonText = 'Take the Quiz', buttonLink = '/quiz' }) {
  return (
    <section className="border border-ink bg-ink">
      <div className="flex flex-col items-start gap-6 p-8 sm:p-12">
        <h2 className="text-3xl uppercase text-white">{title}</h2>
        {body ? <p className="max-w-xl text-white/80">{body}</p> : null}
        <Button as="a" href={buttonLink} variant="primary">
          {buttonText}
        </Button>
      </div>
    </section>
  );
}