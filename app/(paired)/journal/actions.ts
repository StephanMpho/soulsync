"use server";

import { revalidatePath } from "next/cache";
import { getActor } from "@/lib/actor";
import { logActivity } from "@/lib/activity";
import { notifyPartner } from "@/lib/notify";

export async function addJournalEntry(formData: FormData) {
  const kind = formData.get("kind");
  const body = formData.get("body");
  if (typeof kind !== "string" || typeof body !== "string" || !body.trim()) return;

  const actor = await getActor();
  if (!actor) return;
  const { supabase, userId, displayName, coupleId } = actor;

  await supabase.from("journal_entries").insert({
    couple_id: coupleId,
    author_id: userId,
    kind,
    body: body.trim(),
  });

  const text = `${displayName} added a ${kind} to the journal`;
  await logActivity(supabase, coupleId, userId, "journal", text);
  await notifyPartner(supabase, coupleId, userId, "journal", { title: "A new journal entry", body: text, url: "/journal" });

  revalidatePath("/journal");
}
