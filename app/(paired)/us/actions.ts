"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateDates(formData: FormData) {
  const metDate = formData.get("metDate");
  const anniversary = formData.get("anniversary");

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

  const update: Record<string, string> = {};
  if (typeof metDate === "string" && metDate) update.met_date = metDate;
  if (typeof anniversary === "string" && anniversary) update.anniversary = anniversary;
  if (Object.keys(update).length === 0) return;

  const { error } = await supabase.from("couples").update(update).eq("id", profile.couple_id);
  if (error) console.log("[updateDates error]", error);
  revalidatePath("/us");
  revalidatePath("/");
}
