"use server";

import { revalidatePath } from "next/cache";
import { getActor } from "@/lib/actor";
import { logActivity } from "@/lib/activity";
import { notifyPartner } from "@/lib/notify";

export async function sealCapsule(formData: FormData) {
  const title = formData.get("title");
  const body = formData.get("body");
  const unlockDate = formData.get("unlockDate");
  if (typeof title !== "string" || !title.trim()) return;
  if (typeof body !== "string" || !body.trim()) return;
  if (typeof unlockDate !== "string" || !unlockDate) return;

  const actor = await getActor();
  if (!actor) return;
  const { supabase, userId, displayName, coupleId } = actor;

  await supabase.from("capsules").insert({
    couple_id: coupleId,
    author_id: userId,
    title: title.trim(),
    body: body.trim(),
    unlock_date: unlockDate,
  });

  await logActivity(
    supabase,
    coupleId,
    userId,
    "capsule_sealed",
    `${displayName} sealed a time capsule — it unlocks on ${unlockDate}`
  );

  revalidatePath("/capsules");
}

export async function openCapsule(formData: FormData) {
  const id = formData.get("id");
  const title = formData.get("title");
  if (typeof id !== "string" || !id) return;

  const actor = await getActor();
  if (!actor) return;
  const { supabase, userId, displayName, coupleId } = actor;

  await supabase.from("capsules").update({ opened_at: new Date().toISOString() }).eq("id", id);

  if (typeof title === "string" && title) {
    await logActivity(supabase, coupleId, userId, "capsule_opened", `${displayName} opened the time capsule "${title}"`);
    await notifyPartner(supabase, coupleId, userId, "capsule_opened", {
      title: "A time capsule opened ✦",
      body: `${displayName} opened "${title}"`,
      url: "/capsules",
    });
  }

  revalidatePath("/capsules");
}
