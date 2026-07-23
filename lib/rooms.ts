export const MOODS = [
  { key: "calm", label: "Calm", dot: "#A8B8A5" },
  { key: "happy", label: "Happy", dot: "#D6B370" },
  { key: "focused", label: "Focused", dot: "#415A77" },
  { key: "tired", label: "Tired", dot: "#D8A7B1" },
] as const;

// Every room Home links to directly; MORE_ROOMS is the subset also
// reachable from the bottom tab bar's "More" page.
export const ROOMS = [
  { name: "Timeline", href: "/timeline", desc: "Your story on one golden thread — past memories, future dreams.", icon: "❖" },
  { name: "Journal", href: "/journal", desc: "Letters, gratitude and reflections, private to the two of you.", icon: "✎" },
  { name: "Goals", href: "/goals", desc: "Personal and shared goals, plus this week's habits.", icon: "◎" },
  { name: "Capsules", href: "/capsules", desc: "Letters sealed until a future date — open them together.", icon: "⧖" },
  { name: "Finance", href: "/finance", desc: "Shared funds and contributions — money as teamwork.", icon: "◈" },
  { name: "Travel", href: "/travel", desc: "The packing list for your next trip together.", icon: "✈" },
  { name: "Us", href: "/us", desc: "Your dates, your invitation, and the keys to this home.", icon: "❦" },
  { name: "Voice notes", href: "/voice-notes", desc: "Every voice note you've sent each other, in one place.", icon: "🎙" },
  { name: "Garden", href: "/garden", desc: "One flower for every day you both showed up together.", icon: "🌸" },
  { name: "Movie Night", href: "/movie-night", desc: "Watch the same story at the same second, on your own accounts.", icon: "🎬" },
] as const;

export const MORE_ROOMS = ROOMS.filter((r) =>
  ["Capsules", "Finance", "Travel", "Us", "Voice notes", "Garden", "Movie Night"].includes(r.name)
);
