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

function extensionFor(mimeType: string) {
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("aac")) return "aac";
  return "webm";
}

// 20 seconds of opus/aac voice audio is on the order of tens of KB — well
// under the default Server Action body-size limit, so no upload config was
// needed to support this.
export async function sendVoiceNote(formData: FormData) {
  const file = formData.get("audio");
  const durationRaw = formData.get("duration");
  if (!(file instanceof File) || file.size === 0) return;

  const actor = await getActor();
  if (!actor) return;
  const { supabase, userId, displayName, coupleId } = actor;

  const path = `${coupleId}/${crypto.randomUUID()}.${extensionFor(file.type)}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("voice-notes")
    .upload(path, bytes, { contentType: file.type || "audio/webm" });
  if (uploadError) return;

  const duration = typeof durationRaw === "string" ? Math.round(Number(durationRaw)) : null;

  await supabase.from("love_notes").insert({
    couple_id: coupleId,
    from_id: userId,
    audio_path: path,
    duration_seconds: duration,
  });

  await logActivity(supabase, coupleId, userId, "note", `${displayName} sent a voice note ♡`);
  await notifyPartner(supabase, coupleId, userId, "note", {
    title: `${displayName} ♡`,
    body: "Sent you a voice note — tap to listen.",
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

export async function completeDailyPrompt() {
  const actor = await getActor();
  if (!actor) return;
  const { supabase, userId, displayName, coupleId } = actor;

  const today = new Date().toISOString().slice(0, 10);

  await supabase
    .from("daily_completions")
    .upsert({ couple_id: coupleId, date: today, user_id: userId }, { onConflict: "couple_id,date,user_id" });

  const { data: partnerProfile } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("couple_id", coupleId)
    .neq("id", userId)
    .maybeSingle<{ id: string; display_name: string }>();

  if (!partnerProfile) {
    revalidatePath("/");
    return;
  }

  const { data: todayRows } = await supabase
    .from("daily_completions")
    .select("user_id")
    .eq("couple_id", coupleId)
    .eq("date", today)
    .overrideTypes<{ user_id: string }[]>();

  const partnerDoneToday = (todayRows ?? []).some((r) => r.user_id === partnerProfile.id);

  if (partnerDoneToday) {
    await logActivity(
      supabase,
      coupleId,
      userId,
      "streak",
      `${displayName} and ${partnerProfile.display_name} both did today's shared moment ♡ — the garden grows`
    );
    await notifyPartner(supabase, coupleId, userId, "streak_both", {
      title: "Today's moment, complete ♡",
      body: "You both showed up today — one more flower in your garden.",
      url: "/garden",
    });
  } else {
    await logActivity(supabase, coupleId, userId, "streak", `${displayName} completed today's shared moment`);
    await notifyPartner(supabase, coupleId, userId, "streak_nudge", {
      title: `${displayName} did today's moment ♡`,
      body: "Your turn — takes 30 seconds.",
      url: "/",
    });
  }

  revalidatePath("/");
  revalidatePath("/garden");
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
