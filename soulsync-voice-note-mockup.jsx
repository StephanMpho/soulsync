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

const BARS = Array.from({ length: 34 }, (_, i) =>
  8 + Math.round(14 * Math.abs(Math.sin(i * 0.7)) + 6 * Math.abs(Math.sin(i * 1.9)))
);

export default function VoiceNoteMockup() {
  const [stage, setStage] = useState("idle"); // idle | recording | preview | sent | received
  const [secs, setSecs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playhead, setPlayhead] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    if (stage === "recording") {
      timer.current = setInterval(() => setSecs((s) => (s >= 18 ? (stopRecording(), s) : s + 1)), 1000);
    } else {
      clearInterval(timer.current);
    }
    return () => clearInterval(timer.current);
  }, [stage]);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setPlayhead((p) => {
        if (p >= 100) { setPlaying(false); return 0; }
        return p + 100 / (secs * 5);
      });
    }, 200);
    return () => clearInterval(t);
  }, [playing]);

  const startRecording = () => { setSecs(0); setStage("recording"); };
  const stopRecording = () => setStage("preview");
  const send = () => setStage("sent");
  const reset = () => { setStage("idle"); setSecs(0); setPlayhead(0); setPlaying(false); };
  const fmt = (s) => `0:${String(s).padStart(2, "0")}`;

  return (
    <div className="vn-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;1,500&family=Inter:wght@400;500;600&display=swap');
        .vn-root { font-family: 'Inter', sans-serif; color: ${C.charcoal}; background: ${C.ivory}; padding: 28px 20px 40px; max-width: 460px; margin: 0 auto; }
        .vn-caption { font-size: 12px; letter-spacing: .16em; text-transform: uppercase; color: ${C.charcoal}80; margin-bottom: 16px; }

        .vn-card { border-radius: 20px; padding: 20px 22px; background: linear-gradient(150deg, #f7e4e8, ${C.linen} 70%); border: 1px solid ${C.rose}66; box-shadow: 0 1px 2px rgba(45,45,45,.03), 0 12px 32px rgba(109,46,70,.06); }
        .vn-kicker { font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: ${C.burgundy}b3; margin-bottom: 12px; }

        .vn-idle { display: flex; gap: 8px; }
        .vn-input { flex: 1; font: inherit; font-size: 14px; background: ${C.ivory}; border: 1px solid ${C.charcoal}1f; border-radius: 999px; padding: 10px 16px; }
        .vn-mic { width: 40px; height: 40px; border-radius: 50%; border: none; cursor: pointer; background: ${C.burgundy}; color: ${C.ivory}; font-size: 16px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: transform .15s; }
        .vn-mic:hover { transform: scale(1.06); }

        .vn-rec { display: flex; align-items: center; gap: 12px; }
        .vn-dot { width: 10px; height: 10px; border-radius: 50%; background: #c0392b; animation: pulse 1s infinite; flex-shrink: 0; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
        .vn-recbars { flex: 1; display: flex; align-items: center; gap: 2px; height: 32px; overflow: hidden; }
        .vn-recbars i { width: 3px; border-radius: 2px; background: ${C.burgundy}; flex-shrink: 0; animation: bounce .6s ease-in-out infinite alternate; }
        @keyframes bounce { from { transform: scaleY(.4); } to { transform: scaleY(1); } }
        .vn-time { font-variant-numeric: tabular-nums; font-size: 13px; color: ${C.charcoal}99; min-width: 34px; }
        .vn-stop { width: 40px; height: 40px; border-radius: 50%; border: none; cursor: pointer; background: ${C.charcoal}; color: ${C.ivory}; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .vn-cap { font-size: 11.5px; color: ${C.charcoal}66; margin-top: 8px; }

        .vn-player { display: flex; align-items: center; gap: 12px; }
        .vn-play { width: 40px; height: 40px; border-radius: 50%; border: none; cursor: pointer; background: ${C.burgundy}; color: ${C.ivory}; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 13px; }
        .vn-wave { flex: 1; display: flex; align-items: center; gap: 2px; height: 32px; position: relative; }
        .vn-wave i { width: 3px; border-radius: 2px; background: ${C.rose}; flex-shrink: 0; }
        .vn-wave i.played { background: ${C.burgundy}; }
        .vn-dur { font-variant-numeric: tabular-nums; font-size: 13px; color: ${C.charcoal}99; min-width: 34px; text-align: right; }

        .vn-actions { display: flex; gap: 8px; margin-top: 14px; }
        .vn-btn { font: inherit; font-size: 13px; font-weight: 500; cursor: pointer; border-radius: 999px; padding: 9px 17px; border: 1px solid ${C.gold}; background: transparent; color: ${C.burgundy}; }
        .vn-btn.solid { background: ${C.burgundy}; border-color: ${C.burgundy}; color: ${C.ivory}; }

        .vn-sent { text-align: center; padding: 6px 0; }
        .vn-sent b { display: block; font-family: 'Cormorant Garamond', serif; font-size: 19px; color: ${C.burgundy}; margin-bottom: 4px; }
        .vn-sent p { font-size: 13px; color: ${C.charcoal}99; margin: 0 0 14px; }

        .vn-received-from { font-size: 12px; color: ${C.charcoal}80; margin-bottom: 10px; }

        .vn-switch { display: flex; gap: 8px; margin-top: 24px; flex-wrap: wrap; }
        .vn-switch button { font: inherit; font-size: 12px; cursor: pointer; border: 1px solid ${C.charcoal}26; background: ${C.ivory}; color: ${C.charcoal}99; border-radius: 999px; padding: 6px 12px; }
        .vn-switch button.on { background: ${C.burgundy}; border-color: ${C.burgundy}; color: ${C.ivory}; }
      `}</style>

      <div className="vn-caption">Voice-note love note · lives inside the ♡ card on Home</div>

      <div className="vn-card">
        <div className="vn-kicker">Send Konanani a love note ♡</div>

        {stage === "idle" && (
          <div className="vn-idle">
            <input className="vn-input" placeholder="Or write your own…" readOnly />
            <button className="vn-mic" onClick={startRecording} aria-label="Record a voice note">●</button>
          </div>
        )}

        {stage === "recording" && (
          <>
            <div className="vn-rec">
              <span className="vn-dot" />
              <div className="vn-recbars" aria-hidden="true">
                {BARS.slice(0, Math.max(4, Math.round(secs * 1.8))).map((h, i) => (
                  <i key={i} style={{ height: h, animationDelay: `${(i % 6) * 0.08}s` }} />
                ))}
              </div>
              <span className="vn-time">{fmt(secs)}</span>
              <button className="vn-stop" onClick={stopRecording} aria-label="Stop recording">■</button>
            </div>
            <div className="vn-cap">Recording — up to 0:20, so it stays a note, not a voicemail.</div>
          </>
        )}

        {stage === "preview" && (
          <>
            <div className="vn-player">
              <button className="vn-play" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause" : "Play preview"}>
                {playing ? "❚❚" : "▶"}
              </button>
              <div className="vn-wave" aria-hidden="true">
                {BARS.map((h, i) => (
                  <i key={i} className={i / BARS.length * 100 < playhead ? "played" : ""} style={{ height: h }} />
                ))}
              </div>
              <span className="vn-dur">{fmt(secs)}</span>
            </div>
            <div className="vn-actions">
              <button className="vn-btn solid" onClick={send}>Send to Konanani ♡</button>
              <button className="vn-btn" onClick={reset}>Re-record</button>
            </div>
          </>
        )}

        {stage === "sent" && (
          <div className="vn-sent">
            <b>Sent ♡</b>
            <p>Konanani will hear it the moment she opens the app.</p>
            <button className="vn-btn" onClick={reset}>Record another</button>
          </div>
        )}

        {stage === "received" && (
          <>
            <div className="vn-received-from">A voice note from Mpho · just now</div>
            <div className="vn-player">
              <button className="vn-play" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause" : "Play"}>
                {playing ? "❚❚" : "▶"}
              </button>
              <div className="vn-wave" aria-hidden="true">
                {BARS.map((h, i) => (
                  <i key={i} className={i / BARS.length * 100 < playhead ? "played" : ""} style={{ height: h }} />
                ))}
              </div>
              <span className="vn-dur">0:07</span>
            </div>
          </>
        )}
      </div>

      <div className="vn-switch">
        <button className={stage === "idle" ? "on" : ""} onClick={reset}>1. Idle</button>
        <button className={stage === "recording" ? "on" : ""} onClick={startRecording}>2. Recording</button>
        <button className={stage === "preview" ? "on" : ""} onClick={() => { setSecs(7); setStage("preview"); }}>3. Preview</button>
        <button className={stage === "sent" ? "on" : ""} onClick={() => { setSecs(7); setStage("sent"); }}>4. Sent</button>
        <button className={stage === "received" ? "on" : ""} onClick={() => { setSecs(7); setStage("received"); }}>5. Received</button>
      </div>
    </div>
  );
}
