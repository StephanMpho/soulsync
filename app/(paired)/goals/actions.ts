"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActor } from "@/lib/actor";
import { logActivity } from "@/lib/activity";
import { notifyPartner } from "@/lib/notify";

// No activity log here — matches the prototype's bumpGoal, which nudges
// progress silently. Logging every stepper click would spam the feed.
export async function bumpGoal(formData: FormData) {
  const id = formData.get("id");
  const delta = Number(formData.get("delta"));
  if (typeof id !== "string" || !id || !Number.isFinite(delta)) return;

  const supabase = createClient();
  await supabase.rpc("bump_goal_pct", { p_goal_id: id, p_delta: delta });
  revalidatePath("/goals");
}

export async function addGoal(formData: FormData) {
  const name = formData.get("name");
  const scope = formData.get("scope");
  if (typeof name !== "string" || !name.trim() || typeof scope !== "string") return;

  const actor = await getActor();
  if (!actor) return;
  const { supabase, userId, displayName, coupleId } = actor;

  let ownerId: string | null = null;
  if (scope === "mine") {
    ownerId = userId;
  } else if (scope === "theirs") {
    const partnerId = formData.get("partnerId");
    if (typeof partnerId !== "string" || !partnerId) return;
    ownerId = partnerId;
  }

  await supabase.from("goals").insert({ couple_id: coupleId, owner_id: ownerId, name: name.trim(), pct: 0 });

  const prefix = scope === "shared" ? "shared " : "";
  const text = `${displayName} set a new ${prefix}goal: "${name.trim()}"`;
  await logActivity(supabase, coupleId, userId, "goal", text);
  await notifyPartner(supabase, coupleId, userId, "goal", { title: "A new goal", body: text, url: "/goals" });

  revalidatePath("/goals");
}

// Only logs on the false -> true transition, same as the prototype —
// unchecking a habit isn't news.
export async function toggleHabit(formData: FormData) {
  const id = formData.get("id");
  const name = formData.get("name");
  const done = formData.get("done") === "true";
  if (typeof id !== "string" || !id) return;

  const actor = await getActor();
  if (!actor) return;
  const { supabase, userId, displayName, coupleId } = actor;

  await supabase.from("habits").update({ done: !done }).eq("id", id);

  if (!done && typeof name === "string") {
    await logActivity(supabase, coupleId, userId, "habit", `${displayName} completed "${name}"`);
  }

  revalidatePath("/goals");
}

export async function addHabit(formData: FormData) {
  const name = formData.get("name");
  if (typeof name !== "string" || !name.trim()) return;

  const actor = await getActor();
  if (!actor) return;
  const { supabase, coupleId } = actor;

  await supabase.from("habits").insert({ couple_id: coupleId, name: name.trim(), done: false });
  revalidatePath("/goals");
}
