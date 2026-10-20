// src/lib/quiz/questions.js — Digital Superpower Quiz questions
// Each answer maps to one of five persona archetypes.

export const QUESTIONS = [
  { key: 'q1', label: 'When you learn a new tool, what do you do first?', options: [
    { value: 'builder',    label: 'Open it and start building something small' },
    { value: 'educator',   label: 'Look for tutorials or guides before touching it' },
    { value: 'strategist', label: 'Check whether it fits a bigger workflow' },
    { value: 'creator',    label: 'Think about how it could shape my content' },
    { value: 'connector',  label: 'See if I can use it to help someone else' },
  ]},
  { key: 'q2', label: 'Which phrase sounds like a good Saturday?', options: [
    { value: 'builder',    label: 'Tweaking a website or automation until it works' },
    { value: 'educator',   label: 'Reading a deep-dive article or course module' },
    { value: 'strategist', label: "Mapping next quarter's priorities on paper" },
    { value: 'creator',    label: 'Writing, filming, or designing in private' },
    { value: 'connector',  label: 'Checking in on my group or mentoring someone' },
  ]},
  { key: 'q3', label: 'Someone offers you a new project. You ask:', options: [
    { value: 'strategist', label: 'What is the outcome and timeline?' },
    { value: 'builder',    label: 'What tools and assets already exist?' },
    { value: 'educator',   label: 'Who else has done this and what can I learn?' },
    { value: 'creator',    label: 'Who is the audience and what will they feel?' },
    { value: 'connector',  label: 'Who else needs to be in the room?' },
  ]},
  { key: 'q4', label: 'Your ideal income model is:', options: [
    { value: 'builder',    label: 'Owned assets that generate leads or rent' },
    { value: 'educator',   label: 'Courses, templates, or teaching systems' },
    { value: 'strategist', label: 'Advisory or high-leverage planning work' },
    { value: 'creator',    label: 'Content-driven products with automated delivery' },
    { value: 'connector',  label: 'Community, referrals, or partner offers' },
  ]},
  { key: 'q5', label: 'Pick a risk tolerance statement:', options: [
    { value: 'strategist', label: 'I prefer planning over betting' },
    { value: 'builder',    label: 'I will test small and scale what works' },
    { value: 'educator',   label: 'I want proof before I commit' },
    { value: 'creator',    label: 'I care more about autonomy than predictability' },
    { value: 'connector',  label: 'I move forward when I know people are with me' },
  ]},
  { key: 'q6', label: 'Which workflow feels most natural?', options: [
    { value: 'builder',    label: 'Build, measure, improve' },
    { value: 'educator',   label: 'Research, document, share' },
    { value: 'strategist', label: 'Clarify, prioritize, delegate' },
    { value: 'creator',    label: 'Ideate, draft, refine in private' },
    { value: 'connector',  label: 'Listen, match needs, connect people' },
  ]},
  { key: 'q7', label: 'What does "success" actually mean to you?', options: [
    { value: 'builder',    label: 'Assets that work while I am offline' },
    { value: 'educator',   label: 'Clarity I can pass forward to others' },
    { value: 'strategist', label: 'A system that makes decisions easier' },
    { value: 'creator',    label: 'Work that feels like mine, not performative' },
    { value: 'connector',  label: 'A network that lifts everyone' },
  ]},
];

export const PERSONA_VALUES = ['builder', 'educator', 'strategist', 'creator', 'connector'];
