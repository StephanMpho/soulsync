import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

type SubscriptionRow = { id: string; endpoint: string; keys: { p256dh: string; auth: string } };

export type PushPayload = { title: string; body: string; url?: string };

// Sends to every device the user has subscribed on. A 404/410 means the
// browser dropped that subscription (uninstalled, cleared data, etc.) —
// clean it up rather than retrying it forever.
export async function sendPushToUser(supabase: SupabaseClient, userId: string, payload: PushPayload) {
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, keys")
    .eq("user_id", userId)
    .overrideTypes<SubscriptionRow[]>();

  await Promise.all(
    (subs ?? []).map(async (sub) => {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, JSON.stringify(payload));
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    })
  );
}
