"use server";

import { revalidatePath } from "next/cache";
import { getActor } from "@/lib/actor";
import { logActivity } from "@/lib/activity";
import { notifyPartner } from "@/lib/notify";
import { uploadPhoto } from "@/lib/photos";

export async function addJournalEntry(formData: FormData) {
  const kind = formData.get("kind");
  const body = formData.get("body");
  const photo = formData.get("photo");
  if (typeof kind !== "string" || typeof body !== "string" || !body.trim()) return { photoFailed: false };

  const actor = await getActor();
  if (!actor) return { photoFailed: false };
  const { supabase, userId, displayName, coupleId } = actor;

  const hadPhoto = photo instanceof File && photo.size > 0;
  const photoPath = hadPhoto ? await uploadPhoto(supabase, coupleId, photo) : null;
  const photoFailed = hadPhoto && !photoPath;

  await supabase.from("journal_entries").insert({
    couple_id: coupleId,
    author_id: userId,
    kind,
    body: body.trim(),
    photo_path: photoPath,
  });

  const text = `${displayName} added a ${kind} to the journal`;
  await logActivity(supabase, coupleId, userId, "journal", text);
  await notifyPartner(supabase, coupleId, userId, "journal", { title: "A new journal entry", body: text, url: "/journal" });

  revalidatePath("/journal");
  return { photoFailed };
}
