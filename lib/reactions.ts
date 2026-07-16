"use server";

import { revalidatePath } from "next/cache";
import { getActor } from "@/lib/actor";

export type EntryType = "journal" | "timeline";

const PATH_FOR: Record<EntryType, string> = {
  journal: "/journal",
  timeline: "/timeline",
};

// One reaction per user per entry — tapping the same emoji again removes
// it, tapping a different one swaps it. Keeps this a tiny ack, not a
// second commenting system.
export async function toggleReaction(entryType: EntryType, entryId: string, emoji: string) {
  const actor = await getActor();
  if (!actor) return;
  const { supabase, userId, coupleId } = actor;

  const { data: existing } = await supabase
    .from("reactions")
    .select("id, emoji")
    .eq("entry_type", entryType)
    .eq("entry_id", entryId)
    .eq("user_id", userId)
    .maybeSingle()
    .overrideTypes<{ id: string; emoji: string } | null>();

  if (existing?.emoji === emoji) {
    await supabase.from("reactions").delete().eq("id", existing.id);
  } else if (existing) {
    await supabase.from("reactions").update({ emoji }).eq("id", existing.id);
  } else {
    await supabase
      .from("reactions")
      .insert({ couple_id: coupleId, entry_type: entryType, entry_id: entryId, user_id: userId, emoji });
  }

  revalidatePath(PATH_FOR[entryType]);
}
