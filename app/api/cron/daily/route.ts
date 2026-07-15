import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";

type Capsule = { id: string; couple_id: string; title: string };
type Profile = { id: string };
type Couple = { id: string; anniversary: string | null };

function monthDay(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Vercel Cron at 06:00 SAST (04:00 UTC — see vercel.json). Runs once daily:
// notify both partners when a capsule unlocks, reset habits every Monday,
// and send a gentle nudge a week before each couple's anniversary.
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);

  let capsuleUnlocks = 0;
  let anniversaryReminders = 0;

  const { data: capsules } = await supabase
    .from("capsules")
    .select("id, couple_id, title")
    .eq("unlock_date", todayIso)
    .is("opened_at", null)
    .overrideTypes<Capsule[]>();

  for (const capsule of capsules ?? []) {
    const { data: members } = await supabase
      .from("profiles")
      .select("id")
      .eq("couple_id", capsule.couple_id)
      .overrideTypes<Profile[]>();

    await Promise.all(
      (members ?? []).map((m) =>
        sendPushToUser(supabase, m.id, {
          title: "A capsule has unlocked ✦",
          body: `"${capsule.title}" is ready to open together.`,
          url: "/capsules",
        })
      )
    );
    capsuleUnlocks++;
  }

  const isMonday = today.getDay() === 1;
  if (isMonday) {
    await supabase.from("habits").update({ done: false }).eq("done", true);
  }

  const sevenDaysOut = new Date(today);
  sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);
  const targetMonthDay = `${String(sevenDaysOut.getMonth() + 1).padStart(2, "0")}-${String(
    sevenDaysOut.getDate()
  ).padStart(2, "0")}`;

  const { data: couples } = await supabase
    .from("couples")
    .select("id, anniversary")
    .not("anniversary", "is", null)
    .overrideTypes<Couple[]>();

  for (const couple of couples ?? []) {
    if (!couple.anniversary || monthDay(couple.anniversary) !== targetMonthDay) continue;

    const { data: members } = await supabase
      .from("profiles")
      .select("id")
      .eq("couple_id", couple.id)
      .overrideTypes<Profile[]>();

    await Promise.all(
      (members ?? []).map((m) =>
        sendPushToUser(supabase, m.id, {
          title: "Your anniversary is in a week",
          body: "Something to plan for — it's coming up.",
          url: "/us",
        })
      )
    );
    anniversaryReminders++;
  }

  return NextResponse.json({ ok: true, capsuleUnlocks, habitsReset: isMonday, anniversaryReminders });
}
