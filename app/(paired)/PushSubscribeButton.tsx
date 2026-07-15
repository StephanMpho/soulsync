"use client";

import { useEffect, useState } from "react";
import { subscribeToPush } from "./actions";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

type Status = "checking" | "unsupported" | "subscribed" | "available" | "denied";

export function PushSubscribeButton() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      setStatus(existing ? "subscribed" : "available");
    })();
  }, []);

  const enable = async () => {
    const reg = await navigator.serviceWorker.ready;
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setStatus("denied");
      return;
    }
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) return;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
    await subscribeToPush(JSON.stringify(sub.toJSON()));
    setStatus("subscribed");
  };

  if (status === "checking" || status === "unsupported" || status === "subscribed") return null;

  return (
    <section className="ss-card ss-rosecard col-12">
      <div className="ss-kicker">Stay in the loop</div>
      <h3>Turn on notifications</h3>
      <p className="ss-muted" style={{ marginBottom: 12 }}>
        {status === "denied"
          ? "Notifications are blocked for this site in your browser settings — enable them there if you'd like push updates."
          : "Get a push when your partner sends a love note, seals a capsule, or a capsule unlocks. On iPhone, add SoulSync to your Home Screen first — Safari only allows push for installed apps."}
      </p>
      {status === "available" && (
        <button className="ss-btn solid" onClick={enable}>
          Enable notifications
        </button>
      )}
    </section>
  );
}
