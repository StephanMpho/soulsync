// A static rotating list — same prompt for both partners on a given day,
// deterministic from the date so it doesn't need its own table. Pronoun
// tokens ({obj}/{subj}/{poss}/etc.) get filled in per-couple via
// fillPronouns() based on the partner's own stored pronoun, rather than
// baking in "him" or "her" — see lib/pronouns.ts for the token list.
export const DAILY_PROMPTS = [
  "Tell {obj} one thing you've never told {obj} before.",
  "Send a voice note right now — no reason needed.",
  "Name one thing about today that made you think of {obj}.",
  "Write down a memory of the two of you, right now, before it fades.",
  "Tell {obj} what you're most looking forward to about tonight.",
  "Send a photo of whatever's in front of you right now.",
  "Say out loud (or write) one thing you're grateful for about {obj} today.",
  "Ask {obj} a question you've never asked before.",
  "Tell {obj} exactly what you love about the way {subj} laughs.",
  "Plan one small thing to do together this week — say it out loud.",
  "Tell {obj} about a moment today you wish {subj} had seen.",
  "Send a love note that's just one honest sentence.",
  "Describe your perfect ordinary Tuesday with {obj}.",
  "Tell {obj} the thing you're most proud of {obj} for right now.",
  "Ask what's been on {poss} mind lately that {subj} {hasnt} said out loud.",
  "Recreate your first hello — say it to {obj} again, right now.",
  "Tell {obj} one way {subj} {has} changed you for the better.",
  "Share a song that reminds you of {obj} today.",
  "Write one sentence you'd want {obj} to read on a hard day.",
  "Tell {obj} about a dream you had, real or imagined for the future.",
  "Say thank you for something small {subj} probably didn't notice.",
  "Tell {obj} what home feels like when {subj} {is} in it.",
  "Ask {obj} what {subj} {needs} more of from you this week.",
  "Send a voice note of you just saying {poss} name and why you love it.",
  "Tell {obj} the version of you that only {subj} {gets} to see.",
  "Describe a place you'd love to take {obj}, and why.",
  "Tell {obj} one thing that made today feel lighter.",
  "Ask what {subj} {has} been avoiding telling you — gently.",
  "Write down a compliment you've been meaning to say out loud.",
  "Tell {obj} about a time {subj} made you feel completely safe.",
  "Share one small fear, out loud, with {obj}.",
  "Tell {obj} what you'd want to be doing together in ten years.",
  "Say the thing you're most grateful you never said to anyone but {obj}.",
  "Ask {obj} what love has felt like lately, honestly.",
  "Tell {obj} about the smallest thing that made you smile today.",
  "Recreate a memory in one sentence, exactly as it happened.",
  "Tell {obj} what you'd miss most if today were the last ordinary day.",
  "Ask {obj} what {subj} {wishes} you understood about {obj}.",
  "Send a photo from years ago and say what it reminds you of.",
  "Tell {obj} something you admire that you've never said aloud.",
  "Write the ending to: 'I knew I loved you when...'",
  "Tell {obj} one thing you want to get better at, for the two of you.",
  "Ask {obj} what {poss} favorite version of you is.",
  "Tell {obj} about a worry, and let {obj} just listen.",
  "Say one thing you hope never changes between you.",
  "Tell {obj} what today would have been like without {obj} in it.",
  "Ask {obj} for one thing {subj} {needs} this week, no matter how small.",
  "Tell {obj} the truth about how your day actually went.",
  "Write one line that belongs in your story, years from now.",
  "Say the words you almost said this morning but didn't.",
] as const;

export function getPromptForDate(date: Date): string {
  const epochDay = Math.floor(date.getTime() / 86_400_000);
  const index = ((epochDay % DAILY_PROMPTS.length) + DAILY_PROMPTS.length) % DAILY_PROMPTS.length;
  return DAILY_PROMPTS[index];
}
