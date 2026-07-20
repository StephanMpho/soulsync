"use server";

import { revalidatePath } from "next/cache";
import { getActor } from "@/lib/actor";
import { logActivity } from "@/lib/activity";
import { notifyPartner } from "@/lib/notify";
import { uploadPhoto } from "@/lib/photos";

export async function addTimelineEvent(formData: FormData) {
  const title = formData.get("title");
  const note = formData.get("note");
  const future = formData.get("future") === "true";
  const photo = formData.get("photo");
  if (typeof title !== "string" || !title.trim()) return { photoFailed: false };

  const actor = await getActor();
  if (!actor) return { photoFailed: false };
  const { supabase, userId, displayName, coupleId } = actor;

  const noteText = typeof note === "string" && note.trim() ? `${note.trim()} — ${displayName}` : null;
  const hadPhoto = photo instanceof File && photo.size > 0;
  const photoPath = hadPhoto ? await uploadPhoto(supabase, coupleId, photo) : null;
  const photoFailed = hadPhoto && !photoPath;

  await supabase.from("timeline_events").insert({
    couple_id: coupleId,
    author_id: userId,
    title: title.trim(),
    note: noteText,
    kind: future ? "dream" : "memory",
    is_past: !future,
    event_date: future ? null : new Date().toISOString().slice(0, 10),
    photo_path: photoPath,
  });

  const text = `${displayName} placed "${title.trim()}" on the timeline`;
  await logActivity(supabase, coupleId, userId, "memory", text);
  await notifyPartner(supabase, coupleId, userId, "memory", { title: "A new memory", body: text, url: "/timeline" });

  revalidatePath("/timeline");
  return { photoFailed };
}
