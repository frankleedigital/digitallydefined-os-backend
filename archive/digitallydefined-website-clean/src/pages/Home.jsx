import Hero from '../components/Hero.jsx';
import Feature from '../components/Feature.jsx';
import Testimonial from '../components/Testimonial.jsx';
import CTA from '../components/CTA.jsx';

const FEATURES = [
  {
    title: 'Faceless by design',
    description:
      'Everything is built to work without showing your face. Your voice, your brand, your terms.',
  },
  {
    title: 'A roadmap, not a course',
    description:
      'You get a sequenced plan matched to your actual strengths — not a library of generic lessons.',
  },
  {
    title: 'Built for Gen X women',
    description:
      'No hustle culture, no neon energy. Quiet power, intentional strategy, and pricing that respects you.',
  },
];

const TESTIMONIALS = [
  {
    quote:
      'I stopped trying to be visible and started building assets. The roadmap made the first step obvious.',
    name: 'M. R.',
    detail: 'Quiz roadmap client',
  },
  {
    quote:
      'It gave me a system I could run quietly, and my first digital sale without ever going on camera.',
    name: 'D. K.',
    detail: 'Quiz roadmap client',
  },
];

export default function Home() {
  return (
    <div className="home space-y-12 py-10">
      <Hero
        eyebrow="Faceless Digital Real Estate"
        title="Build digital assets without showing your face"
        subtitle="Take the two-minute Digital Superpower Quiz and get a personalized roadmap built around how you actually work best."
        buttonText="Take the Quiz"
        buttonLink="/quiz"
        secondaryText="See how it works"
        secondaryLink="/quiz"
      />

      <section>
        <h2 className="mb-6 text-2xl uppercase">Why it works</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <Feature key={f.title} title={f.title} description={f.description} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-6 text-2xl uppercase">What women are building</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {TESTIMONIALS.map((t) => (
            <Testimonial key={t.name} quote={t.quote} name={t.name} detail={t.detail} />
          ))}
        </div>
      </section>

      <CTA
        title="Find your superpower"
        body="Two minutes. One clear roadmap. No camera required."
        buttonText="Take the Quiz"
        buttonLink="/quiz"
      />
    </div>
  );
}
