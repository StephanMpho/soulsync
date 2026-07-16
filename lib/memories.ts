import type { SupabaseClient } from "@supabase/supabase-js";

type JournalRow = { id: string; body: string; created_at: string };
type TimelineRow = { id: string; title: string; note: string | null; event_date: string | null };

export type OnThisDayMemory = {
  type: "journal" | "timeline";
  id: string;
  text: string;
  yearsAgo: number;
  href: string;
};

function isSameMonthDay(date: Date, today: Date) {
  return date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
}

// Surfaces journal entries and past timeline events whose date matches
// today's month/day in an earlier year — the "on this day" nostalgia hit.
// Filtered in JS rather than in SQL since a couple's history is a handful
// of rows, not a scale where a date-matching query needs to be pushed down.
export async function getOnThisDayMemories(
  supabase: SupabaseClient,
  coupleId: string
): Promise<OnThisDayMemory[]> {
  const today = new Date();

  const [{ data: journalEntries }, { data: timelineEvents }] = await Promise.all([
    supabase
      .from("journal_entries")
      .select("id, body, created_at")
      .eq("couple_id", coupleId)
      .overrideTypes<JournalRow[]>(),
    supabase
      .from("timeline_events")
      .select("id, title, note, event_date")
      .eq("couple_id", coupleId)
      .eq("is_past", true)
      .not("event_date", "is", null)
      .overrideTypes<TimelineRow[]>(),
  ]);

  const memories: OnThisDayMemory[] = [];

  for (const e of journalEntries ?? []) {
    const created = new Date(e.created_at);
    const yearsAgo = today.getFullYear() - created.getFullYear();
    if (yearsAgo > 0 && isSameMonthDay(created, today)) {
      memories.push({ type: "journal", id: e.id, text: e.body, yearsAgo, href: "/journal" });
    }
  }

  for (const t of timelineEvents ?? []) {
    if (!t.event_date) continue;
    const eventDate = new Date(t.event_date + "T00:00:00");
    const yearsAgo = today.getFullYear() - eventDate.getFullYear();
    if (yearsAgo > 0 && isSameMonthDay(eventDate, today)) {
      memories.push({
        type: "timeline",
        id: t.id,
        text: t.note ? `${t.title} — ${t.note}` : t.title,
        yearsAgo,
        href: "/timeline",
      });
    }
  }

  return memories.sort((a, b) => a.yearsAgo - b.yearsAgo);
}
