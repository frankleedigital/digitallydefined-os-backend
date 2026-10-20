import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QuizIntro from '../../components/quiz/QuizIntro.jsx';
import QuizQuestion from '../../components/quiz/QuizQuestion.jsx';
import QuizProgress from '../../components/quiz/QuizProgress.jsx';
import QuizEmailCapture from '../../components/quiz/QuizEmailCapture.jsx';
import { QUESTIONS } from '../../lib/quiz/questions.js';
import { scoreQuiz } from '../../lib/quiz/scoring.js';
import { submitQuiz } from '../../lib/api.js';

const STAGES = { INTRO: 'intro', QUESTIONS: 'questions', EMAIL: 'email' };

export default function QuizPage() {
  const navigate = useNavigate();
  const [stage, setStage] = useState(STAGES.INTRO);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const question = QUESTIONS[step];
  const selected = answers[question.key];

  function select(value) {
    setAnswers((prev) => ({ ...prev, [question.key]: value }));
  }

  function next() {
    if (step < QUESTIONS.length - 1) setStep(step + 1);
    else setStage(STAGES.EMAIL);
  }

  function back() {
    if (step > 0) setStep(step - 1);
    else setStage(STAGES.INTRO);
  }

  async function handleEmailSubmit({ name, email }) {
    setSubmitting(true);
    setError(null);
    try {
      const { persona: key, confidence } = scoreQuiz(answers);
      const data = await submitQuiz({ answers, name, email });
      navigate('/quiz/results', { state: { personaKey: key, confidence, result: data, email } });
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (stage === STAGES.INTRO) return <div className="container-page py-16"><QuizIntro onStart={() => setStage(STAGES.QUESTIONS)} /></div>;

  if (stage === STAGES.EMAIL) {
    return (
      <div className="container-page py-16">
        <QuizEmailCapture onSubmit={handleEmailSubmit} submitting={submitting} error={error} />
      </div>
    );
  }

  return (
    <div className="container-page max-w-2xl py-12">
      <QuizProgress current={step} total={QUESTIONS.length} />
      <QuizQuestion
        question={question}
        selected={selected}
        onSelect={select}
        onNext={next}
        onBack={back}
        index={step}
        total={QUESTIONS.length}
      />
    </div>
  );
}
