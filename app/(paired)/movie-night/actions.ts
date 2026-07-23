"use server";

import { revalidatePath } from "next/cache";
import { getActor } from "@/lib/actor";
import { logActivity } from "@/lib/activity";
import { notifyPartner } from "@/lib/notify";
import { addTimelineEvent } from "../timeline/actions";

// Only http(s) — blocks javascript:/data: URIs from ending up in an <a
// href> that either partner might click.
function isSafeExternalUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// scheduledAtIso must already be a UTC ISO string computed client-side from
// the browser's own local time — converting a bare "YYYY-MM-DDTHH:mm" value
// on the server would interpret it in the server's timezone (UTC on
// Vercel), not the couple's, silently shifting the scheduled time.
export async function scheduleMovieNight(formData: FormData) {
  const title = formData.get("title");
  const service = formData.get("service");
  const scheduledAtIso = formData.get("scheduledAtIso");
  const url = formData.get("url");
  if (typeof title !== "string" || !title.trim()) return { ok: false };
  if (typeof scheduledAtIso !== "string" || Number.isNaN(Date.parse(scheduledAtIso))) return { ok: false };

  const actor = await getActor();
  if (!actor) return { ok: false };
  const { supabase, userId, displayName, coupleId } = actor;

  const serviceValue = typeof service === "string" && service.trim() ? service.trim() : "Other";
  const urlValue = isSafeExternalUrl(url) ? url.trim() : null;

  const { error: insertError } = await supabase.from("movie_nights").insert({
    couple_id: coupleId,
    title: title.trim(),
    service: serviceValue,
    scheduled_at: scheduledAtIso,
    url: urlValue,
    created_by: userId,
  });
  if (insertError) {
    console.error("[scheduleMovieNight] insert failed:", insertError.message, insertError.details, insertError.hint);
    return { ok: false };
  }

  const text = `${displayName} scheduled Movie Night: "${title.trim()}"`;
  await logActivity(supabase, coupleId, userId, "movie_night", text);
  await notifyPartner(supabase, coupleId, userId, "movie_night", {
    title: "Movie Night scheduled ✦",
    body: text,
    url: "/movie-night",
  });

  revalidatePath("/movie-night");
  return { ok: true };
}

// started_at is set a few seconds in the future — both screens count down
// to the same shared moment rather than each starting their own local
// timer, which is what actually keeps the ritual in sync. 7s (not 4s)
// because the round trip for the clicking user's OWN screen to hear this
// back over realtime can itself eat 1-3s, otherwise leaving barely any
// visible countdown by the time it arrives. The action also returns
// startedAt directly so the caller can apply it optimistically instead of
// waiting on that same round trip.
export async function startMovieNightCountdown(movieNightId: string) {
  const actor = await getActor();
  if (!actor) return { ok: false as const };
  const { supabase } = actor;

  const startedAt = new Date(Date.now() + 7000).toISOString();
  const { error } = await supabase
    .from("movie_nights")
    .update({ status: "live", started_at: startedAt })
    .eq("id", movieNightId);
  if (error) {
    console.error("[startMovieNightCountdown] update failed:", error.message);
    return { ok: false as const };
  }

  revalidatePath("/movie-night");
  return { ok: true as const, startedAt };
}

export async function endMovieNight(movieNightId: string) {
  const actor = await getActor();
  if (!actor) return;
  const { supabase } = actor;

  const { error } = await supabase.from("movie_nights").update({ status: "ended" }).eq("id", movieNightId);
  if (error) console.error("[endMovieNight] update failed:", error.message);

  revalidatePath("/movie-night");
}

// For scheduled-but-not-yet-started movie nights only — a real "never
// mind, we're not doing this" cancellation. Ended movie nights are never
// deleted; they stay as permanent history in "Past movie nights".
export async function cancelMovieNight(movieNightId: string) {
  const actor = await getActor();
  if (!actor) return;
  const { supabase } = actor;

  const { error } = await supabase
    .from("movie_nights")
    .delete()
    .eq("id", movieNightId)
    .eq("status", "scheduled");
  if (error) console.error("[cancelMovieNight] delete failed:", error.message);

  revalidatePath("/movie-night");
}

export async function logMovieNightToTimeline(movieNightId: string, title: string, service: string) {
  const actor = await getActor();
  if (!actor) return { ok: false };
  const { supabase } = actor;

  const formData = new FormData();
  formData.set("title", title);
  formData.set("note", `Watched together via ${service} ✦`);
  formData.set("future", "false");
  await addTimelineEvent(formData);

  const { error } = await supabase
    .from("movie_nights")
    .update({ logged_at: new Date().toISOString() })
    .eq("id", movieNightId);
  if (error) console.error("[logMovieNightToTimeline] update failed:", error.message);

  revalidatePath("/movie-night");
  return { ok: true };
}
