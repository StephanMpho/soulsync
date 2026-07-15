export const INVITE_QUESTIONS = [
  "What made you choose this person?",
  "What is your favourite memory together?",
  "What dream do you hope to achieve together?",
];

// Same template the prototype uses to turn three answers into a letter.
export function buildLetter(answers: string[], inviterName: string) {
  return [
    "Every meaningful journey begins with a choice. I chose you.",
    answers[0],
    `I still think about ${answers[1]} — and I want a place where moments like that are never lost.`,
    `One day, ${answers[2]} Until then, let's protect our memories, chase our dreams and build our future — on purpose, together.`,
  ];
}
