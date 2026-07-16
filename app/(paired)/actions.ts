"use server";

import { revalidatePath } from "next/cache";
import { getActor } from "@/lib/actor";
import { logActivity } from "@/lib/activity";
import { notifyPartner } from "@/lib/notify";
import { MOODS } from "@/lib/rooms";

export async function setMood(formData: FormData) {
  const mood = formData.get("mood");
  if (typeof mood !== "string" || !mood) return;

  const actor = await getActor();
  if (!actor) return;
  const { supabase, userId, displayName, coupleId } = actor;

  await supabase
    .from("profiles")
    .update({ mood, mood_updated_at: new Date().toISOString() })
    .eq("id", userId);

  const label = MOODS.find((m) => m.key === mood)?.label.toLowerCase() ?? mood;
  await logActivity(supabase, coupleId, userId, "mood", `${displayName} is feeling ${label} today`);

  revalidatePath("/");
}

export async function sendLoveNote(formData: FormData) {
  const text = formData.get("text");
  if (typeof text !== "string" || !text.trim()) return;

  const actor = await getActor();
  if (!actor) return;
  const { supabase, userId, displayName, coupleId } = actor;

  await supabase.from("love_notes").insert({ couple_id: coupleId, from_id: userId, body: text.trim() });
  await logActivity(supabase, coupleId, userId, "note", `${displayName} sent a love note ♡ "${text.trim()}"`);
  await notifyPartner(supabase, coupleId, userId, "note", {
    title: `${displayName} ♡`,
    body: text.trim(),
    url: "/",
  });

  revalidatePath("/");
}

export async function sendPing() {
  const actor = await getActor();
  if (!actor) return;
  const { supabase, userId, displayName, coupleId } = actor;

  await logActivity(supabase, coupleId, userId, "ping", `${displayName} sent a thinking-of-you ping ♡`);
  await notifyPartner(supabase, coupleId, userId, "ping", {
    title: `${displayName} is thinking of you ♡`,
    body: "No reason — just wanted you to know.",
    url: "/",
  });

  revalidatePath("/");
}

export async function openLoveNote(noteId: string) {
  const actor = await getActor();
  if (!actor) return;
  const { supabase } = actor;

  await supabase
    .from("love_notes")
    .update({ opened_at: new Date().toISOString() })
    .eq("id", noteId)
    .is("opened_at", null);

  revalidatePath("/");
}

export async function subscribeToPush(subscriptionJson: string) {
  const parsed = JSON.parse(subscriptionJson) as { endpoint: string; keys: { p256dh: string; auth: string } };

  const actor = await getActor();
  if (!actor) return;
  const { supabase, userId } = actor;

  await supabase
    .from("push_subscriptions")
    .upsert({ user_id: userId, endpoint: parsed.endpoint, keys: parsed.keys }, { onConflict: "endpoint" });
}
