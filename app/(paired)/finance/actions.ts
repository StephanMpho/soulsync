"use server";

import { revalidatePath } from "next/cache";
import { getActor } from "@/lib/actor";
import { logActivity } from "@/lib/activity";

export async function contribute(formData: FormData) {
  const fundId = formData.get("fundId");
  const fundName = formData.get("fundName");
  const amountRand = Number(formData.get("amount"));
  if (typeof fundId !== "string" || !fundId || !Number.isFinite(amountRand) || amountRand <= 0) return;

  const actor = await getActor();
  if (!actor) return;
  const { supabase, userId, displayName, coupleId } = actor;

  await supabase.rpc("contribute_to_fund", {
    p_fund_id: fundId,
    p_amount_cents: Math.round(amountRand * 100),
  });

  if (typeof fundName === "string" && fundName) {
    await logActivity(
      supabase,
      coupleId,
      userId,
      "fund",
      `${displayName} contributed R${amountRand.toLocaleString("en-ZA")} to the ${fundName} fund`
    );
  }

  revalidatePath("/finance");
}

export async function addFund(formData: FormData) {
  const name = formData.get("name");
  const targetRand = Number(formData.get("target"));
  if (typeof name !== "string" || !name.trim() || !Number.isFinite(targetRand) || targetRand <= 0) return;

  const actor = await getActor();
  if (!actor) return;
  const { supabase, coupleId } = actor;

  await supabase.from("funds").insert({
    couple_id: coupleId,
    name: name.trim(),
    target_cents: Math.round(targetRand * 100),
    saved_cents: 0,
  });

  revalidatePath("/finance");
}
