import { useState, useRef } from "react";

// ————————————————————————————————————————————————————————————————
// SoulSync — Push Notification Preview
// How notifications will appear on the phone in the real product:
// banners dropping in over the lock screen (or any app), with the
// SoulSync icon, sender, and message — tap to jump into the app.
// Use the buttons under the phone to trigger each notification type.
// ————————————————————————————————————————————————————————————————

const C = {
  burgundy: "#6D2E46",
  burgundyDeep: "#4F2033",
  rose: "#D8A7B1",
  gold: "#D6B370",
  ivory: "#FAF7F3",
  linen: "#F3EEE8",
  sage: "#A8B8A5",
  charcoal: "#2D2D2D",
};

const NOTIF_TYPES = [
  {
    key: "note",
    button: "♡ Konanani sends a love note",
    title: "Konanani ♡",
    body: "“Thinking of you. Good luck with the pipeline review today.”",
    hint: "Love notes deliver instantly — the highest-priority notification in the app.",
  },
  {
    key: "memory",
    button: "❖ Konanani adds a memory",
    title: "A new memory",
    body: "Konanani placed “Sunday at the botanical gardens” on your timeline.",
    hint: "Timeline updates arrive quietly — no sound, just a gentle banner.",
  },
  {
    key: "capsule",
    button: "⧖ Time capsule unlocks",
    title: "A capsule has unlocked ✦",
    body: "“Open on our anniversary” — sealed by Mpho, 62 days ago. Open it together.",
    hint: "Capsule unlocks notify both of you at 08:00 on the unlock date.",
  },
  {
    key: "companion",
    button: "🕊 Companion nudge",
    title: "From your companion",
    body: "Konanani has a big day in court tomorrow. A word of encouragement tonight would mean a lot.",
    hint: "Companion nudges are rare and always actionable — never spam.",
  },
  {
    key: "milestone",
    button: "✦ Milestone reached",
    title: "Santorini fund — 100%",
    body: "You did it together. R60 000 saved. Time to book those flights.",
    hint: "Milestones are celebrations — delivered to both phones at the same moment.",
  },
];

let idCounter = 0;

export default function NotificationPreview() {
  const [notifs, setNotifs] = useState([]);
  const [hint, setHint] = useState("Tap a button to see the notification arrive on the phone.");
  const [opened, setOpened] = useState(null);
  const timers = useRef({});

  const trigger = (t) => {
    const id = ++idCounter;
    setOpened(null);
    setHint(t.hint);
    setNotifs((n) => [{ id, ...t, at: "now" }, ...n].slice(0, 3));
  };

  const tapNotif = (n) => {
    setOpened(n);
    setNotifs((list) => list.filter((x) => x.id !== n.id));
  };

  const dismiss = (id) => setNotifs((list) => list.filter((x) => x.id !== id));

  return (
    <div className="np-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,500&family=Inter:wght@400;500;600&display=swap');

        .np-root { min-height: 100vh; background: linear-gradient(165deg, #efe7de, ${C.ivory} 40%, #f2e8e6); font-family: 'Inter', sans-serif; color: ${C.charcoal}; display: flex; flex-direction: column; align-items: center; padding: 30px 16px 60px; }
        .np-caption { font-size: 12px; letter-spacing: .18em; text-transform: uppercase; color: ${C.charcoal}80; margin-bottom: 16px; text-align: center; }

        .np-phone { width: min(380px, 96vw); height: 660px; border-radius: 42px; border: 10px solid ${C.charcoal}; overflow: hidden; position: relative; box-shadow: 0 40px 90px rgba(45,45,45,.3); background: linear-gradient(170deg, ${C.burgundyDeep}, ${C.burgundy} 50%, #8a4560); display: flex; flex-direction: column; }
        .np-notch { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 110px; height: 22px; background: ${C.charcoal}; border-radius: 0 0 14px 14px; z-index: 30; }

        /* lock screen */
        .np-lock { flex: 1; display: flex; flex-direction: column; align-items: center; padding-top: 84px; color: ${C.ivory}; }
        .np-time { font-family: 'Cormorant Garamond', serif; font-size: 64px; font-weight: 400; line-height: 1; }
        .np-date { font-size: 13px; color: ${C.ivory}b3; margin-top: 6px; }
        .np-hintline { position: absolute; bottom: 14px; left: 0; right: 0; text-align: center; }
        .np-hintline i { display: inline-block; width: 120px; height: 4px; border-radius: 999px; background: ${C.ivory}66; }

        /* the notification banner */
        .np-stack { position: absolute; top: 34px; left: 10px; right: 10px; z-index: 20; display: flex; flex-direction: column; gap: 8px; }
        .np-banner { display: flex; gap: 11px; align-items: flex-start; background: ${C.ivory}f0; backdrop-filter: blur(16px); border-radius: 20px; padding: 12px 13px; box-shadow: 0 10px 30px rgba(0,0,0,.25); cursor: pointer; border: none; text-align: left; font: inherit; width: 100%; animation: dropIn .55s cubic-bezier(.22,.9,.34,1.12); }
        @keyframes dropIn { from { opacity: 0; transform: translateY(-56px) scale(.96); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .np-banner { animation: none; } }
        .np-appicon { width: 36px; height: 36px; border-radius: 9px; background: linear-gradient(145deg, ${C.burgundy}, ${C.burgundyDeep}); color: ${C.gold}; display: flex; align-items: center; justify-content: center; font-family: 'Cormorant Garamond', serif; font-size: 17px; flex-shrink: 0; box-shadow: inset 0 0 0 1px ${C.gold}44; }
        .np-btext { flex: 1; min-width: 0; }
        .np-brow { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
        .np-bapp { font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: ${C.charcoal}80; }
        .np-btime { font-size: 11px; color: ${C.charcoal}66; white-space: nowrap; }
        .np-btitle { font-weight: 600; font-size: 13.5px; margin-top: 2px; color: ${C.charcoal}; }
        .np-bbody { font-size: 13px; color: ${C.charcoal}cc; line-height: 1.4; margin-top: 1px; }
        .np-bx { font: inherit; border: none; background: ${C.charcoal}14; color: ${C.charcoal}99; width: 20px; height: 20px; border-radius: 50%; cursor: pointer; font-size: 11px; line-height: 1; flex-shrink: 0; }
        .np-bx:hover { background: ${C.charcoal}26; }

        /* opened state — app opens to the alert */
        .np-openpane { position: absolute; inset: 0; z-index: 25; background: ${C.ivory}; display: flex; flex-direction: column; padding: 60px 22px 22px; animation: rise .45s cubic-bezier(.22,.61,.36,1); }
        @keyframes rise { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .np-openpane { animation: none; } }
        .np-openkicker { font-size: 10.5px; letter-spacing: .18em; text-transform: uppercase; color: ${C.burgundy}b3; margin-bottom: 10px; }
        .np-opentitle { font-family: 'Cormorant Garamond', serif; font-size: 26px; line-height: 1.2; color: ${C.burgundy}; margin: 0 0 12px; }
        .np-openbody { font-family: 'Cormorant Garamond', serif; font-size: 19px; line-height: 1.5; color: ${C.charcoal}; }
        .np-openmeta { margin-top: auto; }
        .np-openmeta p { font-size: 12.5px; color: ${C.charcoal}80; }
        .np-btn { font: inherit; font-size: 14px; font-weight: 500; cursor: pointer; border-radius: 999px; padding: 12px 20px; border: none; background: ${C.burgundy}; color: ${C.ivory}; width: 100%; }
        .np-btn:hover { background: ${C.burgundyDeep}; }

        /* controls */
        .np-controls { width: min(380px, 96vw); margin-top: 22px; }
        .np-controls h4 { font-family: 'Cormorant Garamond', serif; font-size: 19px; font-weight: 600; margin: 0 0 10px; color: ${C.burgundy}; }
        .np-ctl { display: flex; flex-direction: column; gap: 8px; }
        .np-ctlbtn { font: inherit; font-size: 13.5px; text-align: left; cursor: pointer; border: 1px solid ${C.charcoal}1a; background: ${C.linen}; color: ${C.charcoal}; border-radius: 14px; padding: 12px 16px; transition: border-color .2s, transform .2s; }
        .np-ctlbtn:hover { border-color: ${C.burgundy}66; transform: translateY(-1px); }
        .np-ctlbtn:focus-visible { outline: 2px solid ${C.burgundy}; }
        .np-hint { margin-top: 12px; font-size: 13px; color: ${C.charcoal}99; line-height: 1.5; background: ${C.ivory}; border: 1px solid ${C.gold}55; border-radius: 14px; padding: 12px 14px; }
      `}</style>

      <div className="np-caption">Push notification preview · how it lands on the phone</div>

      <div className="np-phone">
        <div className="np-notch" />

        {/* notification banners drop in here */}
        <div className="np-stack" aria-live="polite">
          {notifs.map((n) => (
            <button key={n.id} className="np-banner" onClick={() => tapNotif(n)} aria-label={`Notification: ${n.title}. Tap to open.`}>
              <span className="np-appicon">S</span>
              <span className="np-btext">
                <span className="np-brow">
                  <span className="np-bapp">SoulSync</span>
                  <span className="np-btime">{n.at}</span>
                </span>
                <span className="np-btitle">{n.title}</span>
                <span className="np-bbody">{n.body}</span>
              </span>
              <span className="np-bx" role="button" aria-label="Dismiss"
                onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}>✕</span>
            </button>
          ))}
        </div>

        {/* lock screen */}
        <div className="np-lock">
          <div className="np-time">20:36</div>
          <div className="np-date">Tuesday, 14 July</div>
        </div>
        <div className="np-hintline"><i /></div>

        {/* tapping a notification "opens the app" */}
        {opened && (
          <div className="np-openpane">
            <div className="np-openkicker">SoulSync · opened from notification</div>
            <h2 className="np-opentitle">{opened.title}</h2>
            <p className="np-openbody">{opened.body}</p>
            <div className="np-openmeta">
              <p>In the real app, tapping the banner deep-links straight to the right place — a love note opens on Home, a memory opens the Timeline, a capsule opens ready to unseal.</p>
              <button className="np-btn" onClick={() => setOpened(null)}>Back to lock screen</button>
            </div>
          </div>
        )}
      </div>

      <div className="np-controls">
        <h4>Trigger a notification</h4>
        <div className="np-ctl">
          {NOTIF_TYPES.map((t) => (
            <button key={t.key} className="np-ctlbtn" onClick={() => trigger(t)}>{t.button}</button>
          ))}
        </div>
        <div className="np-hint">{hint}</div>
      </div>
    </div>
  );
}
