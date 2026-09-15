import Button from '../ui/Button.jsx';

export default function QuizIntro({ onStart }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h1 className="text-4xl font-bold tracking-tight">Discover Your Digital Superpower</h1>
      <p className="mt-4 text-brand-muted">
        Answer 7 quick questions and we will identify the one strength you should
        build your digital income around — then generate a personalized roadmap
        and send it to your inbox.
      </p>
      <ul className="mx-auto mt-6 max-w-md space-y-2 text-left text-sm text-brand-muted">
        <li>✓ Takes about 2 minutes</li>
        <li>✓ Personalized roadmap generated for your archetype</li>
        <li>✓ Next 3 steps + recommended tool delivered by email</li>
      </ul>
      <Button className="mt-8" onClick={onStart}>Start the quiz →</Button>
    </div>
  );
}
