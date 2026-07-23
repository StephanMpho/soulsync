import { useState, useEffect, useRef } from "react";

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

const REACTIONS = ["❤️", "😂", "😱", "🥹"];

export default function MovieNightMockup() {
  const [stage, setStage] = useState("scheduled"); // scheduled | countdown | live | rated
  const [count, setCount] = useState(3);
  const [floats, setFloats] = useState([]);
  const [videoOn, setVideoOn] = useState(true);
  const floatId = useRef(0);

  useEffect(() => {
    if (stage !== "countdown") return;
    if (count === 0) { setStage("live"); return; }
    const t = setTimeout(() => setCount((c) => c - 1), 800);
    return () => clearTimeout(t);
  }, [stage, count]);

  const startCountdown = () => { setCount(3); setStage("countdown"); };

  const react = (emoji, from) => {
    const id = ++floatId.current;
    const x = 15 + Math.random() * 70;
    setFloats((f) => [...f, { id, emoji, x, from }]);
    setTimeout(() => setFloats((f) => f.filter((r) => r.id !== id)), 2200);
  };

  return (
    <div className="mn-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;1,500&family=Inter:wght@400;500;600&display=swap');
        .mn-root { font-family: 'Inter', sans-serif; color: ${C.charcoal}; background: ${C.ivory}; padding: 28px 20px 44px; max-width: 460px; margin: 0 auto; }
        .mn-caption { font-size: 12px; letter-spacing: .16em; text-transform: uppercase; color: ${C.charcoal}80; margin-bottom: 16px; }

        /* —— scheduled card —— */
        .mn-card { border-radius: 20px; padding: 22px; background: linear-gradient(150deg, ${C.burgundy}, ${C.burgundyDeep}); color: ${C.ivory}; box-shadow: 0 12px 32px rgba(109,46,70,.15); }
        .mn-kicker { font-size: 11px; letter-spacing: .16em; text-transform: uppercase; color: ${C.gold}; margin-bottom: 10px; }
        .mn-title { font-family: 'Cormorant Garamond', serif; font-size: 26px; margin: 0 0 6px; }
        .mn-sub { font-size: 13.5px; color: ${C.ivory}cc; margin: 0 0 16px; }
        .mn-when { display: flex; align-items: center; gap: 8px; font-size: 13px; color: ${C.ivory}d9; margin-bottom: 18px; }
        .mn-when b { color: ${C.gold}; }
        .mn-btn { font: inherit; font-size: 13.5px; font-weight: 500; cursor: pointer; border-radius: 999px; padding: 11px 20px; border: none; background: ${C.gold}; color: ${C.burgundyDeep}; width: 100%; }
        .mn-btn:hover { filter: brightness(1.05); }
        .mn-btn.ghost { background: transparent; border: 1px solid ${C.ivory}55; color: ${C.ivory}; margin-top: 8px; }
        .mn-openrow { display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,.08); border: 1px solid ${C.ivory}33; border-radius: 14px; padding: 10px 12px; margin-bottom: 12px; }
        .mn-openicon { width: 26px; height: 26px; border-radius: 7px; background: #e50914; color: #fff; font-family: 'Cormorant Garamond', serif; font-weight: 600; font-size: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .mn-opentext { flex: 1; min-width: 0; }
        .mn-opentext b { display: block; font-size: 12.5px; font-weight: 500; }
        .mn-opentext span { display: block; font-size: 11px; color: ${C.ivory}b3; line-height: 1.35; margin-top: 1px; }
        .mn-openbtn { font: inherit; font-size: 11.5px; font-weight: 500; cursor: pointer; border-radius: 999px; padding: 7px 12px; border: 1px solid ${C.ivory}55; background: transparent; color: ${C.ivory}; white-space: nowrap; flex-shrink: 0; }
        .mn-openbtn:hover { background: ${C.ivory}22; }

        /* —— countdown —— */
        .mn-countscreen { border-radius: 20px; background: ${C.burgundyDeep}; color: ${C.ivory}; padding: 60px 20px; text-align: center; }
        .mn-countnum { font-family: 'Cormorant Garamond', serif; font-size: 96px; line-height: 1; color: ${C.gold}; animation: pop .8s ease; }
        @keyframes pop { from { transform: scale(.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .mn-countlabel { font-size: 13px; letter-spacing: .1em; text-transform: uppercase; color: ${C.ivory}b3; margin-top: 10px; }

        /* —— live room —— */
        .mn-room { position: relative; border-radius: 20px; overflow: hidden; background: linear-gradient(160deg, #1c1518, #2d2126); aspect-ratio: 9/16; max-height: 560px; }
        .mn-screen { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: ${C.ivory}55; font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 15px; text-align: center; padding: 0 30px; }
        .mn-topinfo { position: absolute; top: 14px; left: 14px; right: 14px; display: flex; justify-content: space-between; align-items: center; z-index: 5; }
        .mn-nowtitle { display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,.35); backdrop-filter: blur(6px); border-radius: 999px; padding: 6px 12px; font-size: 12px; color: ${C.ivory}; }
        .mn-dot { width: 6px; height: 6px; border-radius: 50%; background: #3fae5c; }
        .mn-timer { background: rgba(0,0,0,.35); backdrop-filter: blur(6px); border-radius: 999px; padding: 6px 12px; font-size: 12px; color: ${C.ivory}b3; font-variant-numeric: tabular-nums; }

        /* video bubble */
        .mn-bubble { position: absolute; bottom: 96px; right: 14px; width: 76px; height: 76px; border-radius: 50%; overflow: hidden; border: 2px solid ${C.gold}; box-shadow: 0 6px 18px rgba(0,0,0,.4); z-index: 6; background: linear-gradient(140deg, ${C.rose}, ${C.linen}); display: flex; align-items: center; justify-content: center; }
        .mn-bubble.off { background: ${C.charcoal}; }
        .mn-bubble span { font-family: 'Cormorant Garamond', serif; font-size: 26px; color: ${C.burgundy}; }
        .mn-bubble.off span { color: ${C.ivory}66; font-size: 20px; }

        /* floating reactions */
        .mn-floats { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
        .mn-float { position: absolute; bottom: 90px; font-size: 26px; animation: floatUp 2.2s ease-out forwards; }
        @keyframes floatUp { 0% { transform: translateY(0) scale(.7); opacity: 0; } 15% { opacity: 1; transform: translateY(-10px) scale(1.1); } 100% { transform: translateY(-220px) scale(1); opacity: 0; } }
        .mn-fromtag { position: absolute; bottom: -14px; left: 50%; transform: translateX(-50%); font-size: 8px; color: ${C.ivory}99; white-space: nowrap; }

        /* reaction bar */
        .mn-reactbar { position: absolute; bottom: 14px; left: 14px; right: 14px; display: flex; gap: 8px; z-index: 6; }
        .mn-react { flex: 1; font-size: 20px; background: rgba(255,255,255,.12); backdrop-filter: blur(6px); border: none; border-radius: 14px; padding: 10px 0; cursor: pointer; transition: transform .15s, background .15s; }
        .mn-react:hover { background: rgba(255,255,255,.22); transform: translateY(-2px); }
        .mn-react:focus-visible { outline: 2px solid ${C.gold}; }

        .mn-endbtn { position: absolute; top: 14px; left: 50%; transform: translateX(-50%); }

        /* —— rated / after —— */
        .mn-after { border-radius: 20px; background: ${C.linen}; padding: 24px; text-align: center; }
        .mn-after b { display: block; font-family: 'Cormorant Garamond', serif; font-size: 22px; color: ${C.burgundy}; margin-bottom: 6px; }
        .mn-after p { font-size: 13.5px; color: ${C.charcoal}99; margin: 0 0 16px; }

        .mn-switch { display: flex; gap: 8px; margin-top: 22px; flex-wrap: wrap; }
        .mn-switch button { font: inherit; font-size: 12px; cursor: pointer; border: 1px solid ${C.charcoal}26; background: ${C.ivory}; color: ${C.charcoal}99; border-radius: 999px; padding: 6px 12px; }
        .mn-switch button.on { background: ${C.burgundy}; border-color: ${C.burgundy}; color: ${C.ivory}; }
      `}</style>

      <div className="mn-caption">Movie Night · a room inside SoulSync</div>

      {stage === "scheduled" && (
        <div className="mn-card">
          <div className="mn-kicker">Movie Night ✦ Long-distance, together</div>
          <h3 className="mn-title">The Grand Budapest Hotel</h3>
          <p className="mn-sub">On Netflix · Konanani picked it</p>
          <div className="mn-when">🕗 Tonight <b>at 20:00</b> · both of you, 380km apart</div>
          <div className="mn-openrow">
            <span className="mn-openicon">N</span>
            <div className="mn-opentext">
              <b>Step 1 — open it yourselves</b>
              <span>Each of you needs your own Netflix login. SoulSync doesn't play the film — it just keeps you in sync.</span>
            </div>
            <button className="mn-openbtn">Open Netflix ↗</button>
          </div>
          <button className="mn-btn" onClick={startCountdown}>Step 2 — we're both ready, start the countdown</button>
          <button className="mn-btn ghost">Reschedule</button>
        </div>
      )}

      {stage === "countdown" && (
        <div className="mn-countscreen">
          <div className="mn-countnum" key={count}>{count === 0 ? "▶" : count}</div>
          <div className="mn-countlabel">{count === 0 ? "Press play, now" : "Both of you, press play in…"}</div>
        </div>
      )}

      {stage === "live" && (
        <div className="mn-room">
          <div className="mn-screen">Your Netflix app plays the film underneath —<br />switch back to it any time. SoulSync floats<br />on top for reactions and her face.</div>

          <div className="mn-topinfo">
            <div className="mn-nowtitle"><span className="mn-dot" />Watching together</div>
            <div className="mn-timer">0:14:22</div>
          </div>

          <button className="mn-endbtn mn-btn ghost" style={{ width: "auto", padding: "6px 16px", fontSize: 12 }} onClick={() => setStage("rated")}>End movie night</button>

          <div className="mn-floats" aria-hidden="true">
            {floats.map((f) => (
              <div key={f.id} className="mn-float" style={{ left: `${f.x}%` }}>
                {f.emoji}
                <span className="mn-fromtag">{f.from}</span>
              </div>
            ))}
          </div>

          <button className={`mn-bubble ${videoOn ? "" : "off"}`} onClick={() => setVideoOn((v) => !v)} aria-label="Toggle Konanani's video bubble">
            <span>{videoOn ? "K" : "⊘"}</span>
          </button>

          <div className="mn-reactbar" role="group" aria-label="Send a reaction">
            {REACTIONS.map((e) => (
              <button key={e} className="mn-react" onClick={() => react(e, "You")}>{e}</button>
            ))}
          </div>
        </div>
      )}

      {stage === "rated" && (
        <div className="mn-after">
          <b>How was movie night?</b>
          <p>Add it to your timeline — 380km apart, watching the same story at the same second.</p>
          <button className="mn-btn" style={{ background: C.burgundy, color: C.ivory }} onClick={() => setStage("scheduled")}>Add to timeline ✦</button>
        </div>
      )}

      <div className="mn-switch">
        <button className={stage === "scheduled" ? "on" : ""} onClick={() => setStage("scheduled")}>1. Scheduled</button>
        <button className={stage === "countdown" ? "on" : ""} onClick={startCountdown}>2. 3-2-1 countdown</button>
        <button className={stage === "live" ? "on" : ""} onClick={() => setStage("live")}>3. Live — try the reactions ↓</button>
        <button className={stage === "rated" ? "on" : ""} onClick={() => setStage("rated")}>4. After</button>
      </div>
      {stage === "live" && (
        <p style={{ fontSize: 12.5, color: `${C.charcoal}80`, marginTop: 10 }}>
          Tap ❤️ 😂 😱 🥹 above to send a reaction — watch it float up on "both" screens.
        </p>
      )}
    </div>
  );
}
