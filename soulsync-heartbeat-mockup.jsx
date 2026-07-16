import { useState } from "react";

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

export default function HeartbeatMockup() {
  const [state, setState] = useState("both"); // alone | her | both

  return (
    <div className="hb-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;1,500&family=Inter:wght@400;500;600&display=swap');
        .hb-root { font-family: 'Inter', sans-serif; color: ${C.charcoal}; background: ${C.ivory}; padding: 30px 20px 44px; max-width: 460px; margin: 0 auto; }
        .hb-caption { font-size: 12px; letter-spacing: .16em; text-transform: uppercase; color: ${C.charcoal}80; margin-bottom: 18px; }

        /* the app header bar, where the indicator lives */
        .hb-topbar { display: flex; align-items: center; justify-content: space-between; background: ${C.ivory}; border-bottom: 1px solid ${C.gold}44; padding: 14px 18px; border-radius: 16px 16px 0 0; }
        .hb-brand { font-family: 'Cormorant Garamond', serif; font-size: 18px; letter-spacing: .18em; text-transform: uppercase; color: ${C.burgundy}; }

        .hb-indicator { display: flex; align-items: center; gap: 7px; font-size: 12.5px; color: ${C.charcoal}99; }
        .hb-dot { width: 8px; height: 8px; border-radius: 50%; background: ${C.charcoal}22; flex-shrink: 0; }
        .hb-dot.on { background: #3fae5c; box-shadow: 0 0 0 3px #3fae5c22; }

        .hb-heart { width: 18px; height: 18px; flex-shrink: 0; }
        .hb-heart.pulse { animation: beat 1.15s ease-in-out infinite; transform-origin: center; }
        @keyframes beat {
          0%, 100% { transform: scale(1); }
          14% { transform: scale(1.22); }
          28% { transform: scale(1); }
          42% { transform: scale(1.14); }
          58% { transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) { .hb-heart.pulse { animation: none; } }

        /* the scene below the bar — sets mood per state */
        .hb-scene { border: 1px solid ${C.gold}33; border-top: none; border-radius: 0 0 16px 16px; padding: 40px 24px; text-align: center; background: ${C.linen}; min-height: 180px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; }
        .hb-scene.together { background: linear-gradient(160deg, #f7e9ec, ${C.linen} 70%); }
        .hb-bighearts { display: flex; align-items: center; gap: 18px; margin-bottom: 4px; }
        .hb-bigheart { width: 46px; height: 46px; }
        .hb-line { font-family: 'Cormorant Garamond', serif; font-size: 21px; color: ${C.burgundy}; margin: 0; }
        .hb-sub { font-size: 13px; color: ${C.charcoal}80; margin: 0; max-width: 280px; }

        .hb-switch { display: flex; gap: 8px; margin-top: 26px; flex-wrap: wrap; }
        .hb-switch button { font: inherit; font-size: 12.5px; cursor: pointer; border: 1px solid ${C.charcoal}26; background: ${C.ivory}; color: ${C.charcoal}99; border-radius: 999px; padding: 7px 14px; }
        .hb-switch button.on { background: ${C.burgundy}; border-color: ${C.burgundy}; color: ${C.ivory}; }
      `}</style>

      <div className="hb-caption">Heartbeat presence · the indicator sits in your header, always</div>

      <div className="hb-topbar">
        <div className="hb-brand">SoulSync</div>

        {state === "alone" && (
          <div className="hb-indicator">
            <span className="hb-dot" />
            Konanani isn't here right now
          </div>
        )}

        {state === "her" && (
          <div className="hb-indicator">
            <span className="hb-dot on" />
            Konanani is here
          </div>
        )}

        {state === "both" && (
          <div className="hb-indicator">
            <HeartIcon className="hb-heart pulse" />
            Together, right now
          </div>
        )}
      </div>

      <div className={`hb-scene ${state === "both" ? "together" : ""}`}>
        {state === "alone" && (
          <>
            <p className="hb-line">Just you, for now</p>
            <p className="hb-sub">No signal, no pressure — she'll show up here the moment she opens SoulSync.</p>
          </>
        )}
        {state === "her" && (
          <>
            <p className="hb-line">🟢 Konanani is home</p>
            <p className="hb-sub">Not "online." Not "active." Just — she's here too, somewhere in the app right now.</p>
          </>
        )}
        {state === "both" && (
          <>
            <div className="hb-bighearts">
              <HeartIcon className="hb-bigheart pulse" />
              <HeartIcon className="hb-bigheart pulse" style={{ animationDelay: ".05s" }} />
            </div>
            <p className="hb-line">You're both here, right now</p>
            <p className="hb-sub">No words needed. Just the quiet knowledge that you're both, in this moment, home.</p>
          </>
        )}
      </div>

      <div className="hb-switch">
        <button className={state === "alone" ? "on" : ""} onClick={() => setState("alone")}>Alone</button>
        <button className={state === "her" ? "on" : ""} onClick={() => setState("her")}>She's online</button>
        <button className={state === "both" ? "on" : ""} onClick={() => setState("both")}>Both online</button>
      </div>
    </div>
  );
}

function HeartIcon({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill={C.burgundy} aria-hidden="true">
      <path d="M12 21s-7.5-4.6-10.2-9.3C.3 8.9 1.4 5.4 4.6 4.2c2-.8 4.2-.1 5.6 1.6l1.8 2.2 1.8-2.2c1.4-1.7 3.6-2.4 5.6-1.6 3.2 1.2 4.3 4.7 2.8 7.5C19.5 16.4 12 21 12 21z" />
    </svg>
  );
}
