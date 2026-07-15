"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function togglePackingItem(formData: FormData) {
  const id = formData.get("id");
  const done = formData.get("done") === "true";
  if (typeof id !== "string" || !id) return;

  const supabase = createClient();
  await supabase.from("packing_items").update({ done: !done }).eq("id", id);
  revalidatePath("/travel");
}

export async function addPackingItem(formData: FormData) {
  const name = formData.get("name");
  if (typeof name !== "string" || !name.trim()) return;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("couple_id")
    .eq("id", user.id)
    .single()
    .overrideTypes<{ couple_id: string | null }>();
  if (!profile?.couple_id) return;

  await supabase
    .from("packing_items")
    .insert({ couple_id: profile.couple_id, name: name.trim(), done: false });
  revalidatePath("/travel");
}
