export type CompletionRow = { date: string; user_id: string };

export type StreakState = {
  streak: number;
  gardenCount: number;
  myDoneToday: boolean;
  partnerDoneToday: boolean;
};

// A day counts toward the streak/garden only once both partners have a
// completion row for it — "don't break the chain" is meant to be pulled by
// both people, not either one alone.
export function computeStreakState(rows: CompletionRow[], userId: string, partnerId: string): StreakState {
  const byDate = new Map<string, Set<string>>();
  for (const r of rows) {
    if (!byDate.has(r.date)) byDate.set(r.date, new Set());
    byDate.get(r.date)!.add(r.user_id);
  }

  const bothDates = new Set(
    [...byDate.entries()].filter(([, users]) => users.has(userId) && users.has(partnerId)).map(([date]) => date)
  );

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const todayUsers = byDate.get(todayStr) ?? new Set<string>();

  // If today isn't complete yet, count the streak up through yesterday so
  // an in-progress streak doesn't look broken before the day is even over.
  const cursor = new Date(today);
  if (!bothDates.has(todayStr)) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (bothDates.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return {
    streak,
    gardenCount: bothDates.size,
    myDoneToday: todayUsers.has(userId),
    partnerDoneToday: todayUsers.has(partnerId),
  };
}
