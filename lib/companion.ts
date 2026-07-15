import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";

const anthropic = new Anthropic();

const CACHE_HOURS = 12;

type CachedInsight = { insight: string; generated_at: string };
type ActivityRow = { payload: { text?: string } };
type GoalRow = { name: string; pct: number };
type ProfileRow = { display_name: string; mood: string | null };
type HabitRow = { done: boolean };

// POST /api/companion wraps this same function — Home calls it directly to
// avoid an unnecessary self-fetch round trip from a Server Component.
export async function getCompanionInsight(supabase: SupabaseClient, coupleId: string): Promise<string> {
  const { data: cached } = await supabase
    .from("companion_insights")
    .select("insight, generated_at")
    .eq("couple_id", coupleId)
    .maybeSingle<CachedInsight>();

  if (cached) {
    const ageHours = (Date.now() - new Date(cached.generated_at).getTime()) / 36e5;
    if (ageHours < CACHE_HOURS) {
      return cached.insight;
    }
  }

  const fresh = await generateInsight(supabase, coupleId);

  await supabase
    .from("companion_insights")
    .upsert({ couple_id: coupleId, insight: fresh, generated_at: new Date().toISOString() });

  return fresh;
}

async function generateInsight(supabase: SupabaseClient, coupleId: string): Promise<string> {
  const [{ data: activity }, { data: goals }, { data: profiles }, { data: habits }, { count: journalCount }] =
    await Promise.all([
      supabase
        .from("activity")
        .select("payload")
        .eq("couple_id", coupleId)
        .order("created_at", { ascending: false })
        .limit(8)
        .overrideTypes<ActivityRow[]>(),
      supabase.from("goals").select("name, pct").eq("couple_id", coupleId).overrideTypes<GoalRow[]>(),
      supabase
        .from("profiles")
        .select("display_name, mood")
        .eq("couple_id", coupleId)
        .overrideTypes<ProfileRow[]>(),
      supabase.from("habits").select("done").eq("couple_id", coupleId).overrideTypes<HabitRow[]>(),
      supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("couple_id", coupleId),
    ]);

  const habitList = habits ?? [];
  const allHabitsDone = habitList.length > 0 && habitList.every((h) => h.done);
  const fallback = allHabitsDone
    ? "All of this week's habits are done — that deserves a celebration. Plan something small for tonight?"
    : !journalCount
      ? "Your journal is still empty. The first entry is the hardest — one honest sentence is enough."
      : "Your story is growing. Is there a moment from this week that belongs on the timeline?";

  if (!process.env.ANTHROPIC_API_KEY) {
    return fallback;
  }

  const context = {
    recentActivity: (activity ?? []).map((a) => a.payload?.text).filter(Boolean),
    goals: (goals ?? []).map((g) => `${g.name} (${g.pct}%)`),
    moods: (profiles ?? []).map((p) => `${p.display_name}: ${p.mood ?? "not set"}`),
  };

  try {
    const response = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 150,
      system:
        "You are SoulSync's companion — a warm, perceptive voice inside a private couple's app. " +
        "Given a compact snapshot of recent activity, goals, and moods, write exactly ONE short insight " +
        "(one to two sentences) for whoever opens the app next. Reference specifics from the data " +
        "naturally when you can; otherwise offer a gentle, concrete nudge — never generic filler like " +
        "'communication is important'. Never invent details that aren't in the data. Output only the " +
        "insight text: no preamble, no quotes, no labels.",
      messages: [{ role: "user", content: JSON.stringify(context, null, 2) }],
    });

    const block = response.content.find((b) => b.type === "text");
    const text = block?.type === "text" ? block.text.trim() : "";
    return text || fallback;
  } catch {
    return fallback;
  }
}
