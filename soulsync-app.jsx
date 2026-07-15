import { useState, useEffect } from "react";

// ————————————————————————————————————————————————————————————————
// SoulSync — Mpho & Konanani
//
// NAVIGATION MODEL (this update):
//   • Fixed bottom tab bar, always visible: Home · Timeline · Journal ·
//     Goals · More. "More" holds Finance, Travel and Us.
//   • Every screen except Home has a ← back button in its header.
//     Back follows real history (screen by screen), and always
//     bottoms out at Home.
//   • The Home dashboard lists every room of the app as tappable
//     cards, so nothing is ever hidden.
//   • First launch still runs the invitation journey once, then
//     lands on Home. All data persists across sessions.
// ————————————————————————————————————————————————————————————————

const KEY = "soulsync-home-v1";

const C = {
  burgundy: "#6D2E46",
  burgundyDeep: "#4F2033",
  rose: "#D8A7B1",
  gold: "#D6B370",
  ivory: "#FAF7F3",
  linen: "#F3EEE8",
  sage: "#A8B8A5",
  emerald: "#3F7D58",
  navy: "#415A77",
  charcoal: "#2D2D2D",
};

const P1 = "Mpho";
const P2 = "Konanani";

const MOODS = [
  { key: "calm", label: "Calm", dot: C.sage },
  { key: "happy", label: "Happy", dot: C.gold },
  { key: "focused", label: "Focused", dot: C.navy },
  { key: "tired", label: "Tired", dot: C.rose },
];

const INVITE_QS = [
  "What made you choose this person?",
  "What is your favourite memory together?",
  "What dream do you hope to achieve together?",
];

const DEFAULT_DATA = {
  coupled: false,
  inviteAnswers: ["", "", ""],
  activity: [],
  notes: [],
  capsules: [],
  activeUser: P1,
  metDate: "2023-03-14",
  anniversary: "2024-09-14",
  moods: { [P1]: null, [P2]: null },
  timeline: [
    { when: "14 Mar 2023", title: "The day we met", note: "Where it all began.", kind: "Milestone", past: true },
  ],
  journal: [],
  goals: {
    shared: [
      { name: "Santorini fund", pct: 80, color: C.gold },
      { name: "Read 24 books together", pct: 58, color: C.navy },
    ],
    [P1]: [{ name: "GCP Professional Data Engineer cert", pct: 45, color: C.emerald }],
    [P2]: [{ name: "Morning runs · 3× a week", pct: 66, color: C.emerald }],
  },
  habits: [
    { name: "Evening walk together", done: false },
    { name: "No phones at dinner", done: false },
    { name: "One new memory this week", done: false },
  ],
  funds: [
    { name: "Santorini fund", saved: 48000, target: 60000, color: C.gold },
    { name: "Home deposit", saved: 86000, target: 400000, color: C.navy },
    { name: "Emergency fund", saved: 54000, target: 90000, color: C.emerald },
  ],
  packing: [
    { name: "Passports & visas", done: false },
    { name: "Travel insurance docs", done: false },
    { name: "Camera + spare cards", done: false },
  ],
};

// —— storage ————————————————————————————————————————————————————
async function loadData() {
  try {
    if (!window.storage) return null;
    const r = await window.storage.get(KEY);
    if (!r) return null;
    // migrate any data saved under the earlier spelling
    const raw = r.value.split("Konanai").join("Konanani");
    return { ...DEFAULT_DATA, ...JSON.parse(raw) };
  } catch {
    return null;
  }
}
async function saveData(d) {
  try {
    if (window.storage) await window.storage.set(KEY, JSON.stringify(d));
  } catch (e) {
    console.error("Save failed", e);
  }
}
async function wipeData() {
  try {
    if (window.storage) await window.storage.delete(KEY);
  } catch (e) {}
}

// —— helpers ————————————————————————————————————————————————————
const days = (iso) => Math.max(0, Math.floor((Date.now() - new Date(iso + "T00:00:00")) / 864e5));
const toAnniv = (iso) => {
  const n = new Date();
  const d = new Date(iso + "T00:00:00");
  d.setFullYear(n.getFullYear());
  if (d < n) d.setFullYear(n.getFullYear() + 1);
  return Math.ceil((d - n) / 864e5);
};
const fmtR = (n) => "R" + n.toLocaleString("en-ZA");
const today = () =>
  new Date().toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });

function Kicker({ children }) {
  return <div className="ss-kicker">{children}</div>;
}
function Bar({ pct, color }) {
  return (
    <div className="ss-bar">
      <i style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
    </div>
  );
}
function Ring({ pct, size = 84, label }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={label || `${pct}%`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.ivory} strokeWidth="6" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.gold} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - Math.min(pct, 100) / 100)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.22,.61,.36,1)" }} />
      <text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle"
        style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19, fill: C.charcoal }}>{Math.min(pct, 100)}%</text>
    </svg>
  );
}

// —— navigation metadata ————————————————————————————————————————
const TABS = ["Home", "Timeline", "Journal", "Goals", "More"];
const TAB_ICONS = { Home: "⌂", Timeline: "❖", Journal: "✎", Goals: "◎", More: "⋯" };
const SECTIONS = {
  Timeline: "Your story on one golden thread — past memories, future dreams.",
  Journal: "Letters, gratitude and reflections, private to the two of you.",
  Goals: "Personal and shared goals, plus this week's habits.",
  Capsules: "Letters sealed until a future date — open them together.",
  Finance: "Shared funds and contributions — money as teamwork.",
  Travel: "The next trip, the packing list, the countdown.",
  Us: "Your dates, your invitation, and the keys to this home.",
};
const SECTION_ICONS = { Timeline: "❖", Journal: "✎", Goals: "◎", Capsules: "⧖", Finance: "◈", Travel: "✈", Us: "❦" };

// —— the invitation journey (first launch only) ——————————————————
function InviteJourney({ answers, onAnswers, onComplete }) {
  const [stage, setStage] = useState("welcome");
  const [sealed, setSealed] = useState(true);
  const canCreate = answers.every((a) => a.trim());
  const back = () => {
    if (stage === "questions") setStage("welcome");
    else if (stage === "seal") { setSealed(true); setStage("questions"); }
    else if (stage === "celebrate") setStage("seal");
  };

  return (
    <>
      {stage !== "welcome" && stage !== "celebrate" && (
        <button className="ss-back" onClick={back} aria-label="Go back">← Back</button>
      )}

      {stage === "welcome" && (
        <div className="ss-center">
          <div className="ss-wordmark" style={{ marginBottom: 26 }}>SoulSync</div>
          <h1 className="ss-greet" style={{ textAlign: "center" }}>Before the app,<br /><em>there is an invitation.</em></h1>
          <p className="ss-sub" style={{ textAlign: "center", margin: "16px auto 30px" }}>
            SoulSync begins the way every good story does — with one person choosing another.
            Answer three questions, and we'll turn them into a letter for Konanani.
          </p>
          <button className="ss-btn solid" onClick={() => setStage("questions")}>Begin</button>
        </div>
      )}

      {stage === "questions" && (
        <>
          <section className="ss-hero slim">
            <h1 className="ss-greet sm">Three questions, <em>from the heart</em></h1>
            <p className="ss-sub">Your answers become the letter she opens — and the first pages of your timeline.</p>
          </section>
          <div className="ss-grid">
            {INVITE_QS.map((q, i) => (
              <section className="ss-card col-12" key={q}>
                <Kicker>Question {i + 1} of 3</Kicker>
                <h3>{q}</h3>
                <textarea className="ss-input" rows={2} value={answers[i]}
                  onChange={(e) => onAnswers(answers.map((a, j) => (j === i ? e.target.value : a)))}
                  placeholder="A sentence is enough." />
              </section>
            ))}
            <div className="col-12">
              <button className="ss-btn solid" disabled={!canCreate} style={{ opacity: canCreate ? 1 : 0.45 }}
                onClick={() => setStage("seal")}>Create her invitation</button>
            </div>
          </div>
        </>
      )}

      {stage === "seal" && (
        <div className="ss-letter-wrap">
          {sealed ? (
            <div style={{ textAlign: "center" }}>
              <p className="ss-sub" style={{ marginBottom: 24 }}>This is what arrives on Konanani's phone.</p>
              <button className="ss-envelope" onClick={() => setSealed(false)} aria-label="Break the seal and open the invitation">
                <div className="ss-env-flap" />
                <div className="ss-seal">M</div>
                <div className="ss-env-name">For Konanani</div>
              </button>
              <p className="ss-sub" style={{ marginTop: 22, fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase" }}>Tap the seal to open</p>
            </div>
          ) : (
            <div className="ss-letter">
              <div className="ss-letter-head">Mpho has invited you to build something beautiful.</div>
              <div className="ss-letter-body">
                <p>Every meaningful journey begins with a choice. I chose you.</p>
                <p>{answers[0]}</p>
                <p>I still think about {answers[1]} — and I want a place where moments like that are never lost.</p>
                <p>One day, {answers[2]} Until then, let's protect our memories, chase our dreams and build our future — on purpose, together.</p>
                <p className="ss-letter-sign">— Mpho</p>
              </div>
              <button className="ss-btn solid" onClick={() => setStage("celebrate")}>She accepts ✦</button>
            </div>
          )}
        </div>
      )}

      {stage === "celebrate" && (
        <div className="ss-center">
          <div className="ss-stars">
            <span className="star a" /><span className="star b" /><span className="thread-line" />
          </div>
          <h1 className="ss-greet" style={{ textAlign: "center" }}>Today marks the beginning<br /><em>of your shared journey.</em></h1>
          <p className="ss-sub" style={{ textAlign: "center", margin: "16px auto 28px" }}>
            Your answers are now the first pages of your timeline. Your home is ready.
          </p>
          <button className="ss-btn solid" onClick={onComplete}>Enter your shared home</button>
        </div>
      )}
    </>
  );
}

// —— main app ————————————————————————————————————————————————————
export default function SoulSync() {
  const [data, setData] = useState(null);
  const [stack, setStack] = useState(["Home"]); // navigation history
  const [saving, setSaving] = useState(false);
  const screen = stack[stack.length - 1];

  useEffect(() => {
    (async () => {
      const stored = await loadData();
      setData(stored || { ...DEFAULT_DATA });
    })();
  }, []);

  useEffect(() => {
    try { window.scrollTo({ top: 0, behavior: "instant" }); } catch { window.scrollTo(0, 0); }
  }, [screen]);

  const commit = (next) => {
    setData(next);
    setSaving(true);
    saveData(next).finally(() => setTimeout(() => setSaving(false), 400));
  };

  // —— navigation ——
  const navigate = (s) => setStack((prev) => (prev[prev.length - 1] === s ? prev : [...prev, s]));
  const goBack = () => setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  const tabTap = (t) => setStack(t === "Home" ? ["Home"] : ["Home", t]);
  const activeTab = TABS.includes(screen) ? screen : ["Capsules", "Finance", "Travel", "Us"].includes(screen) ? "More" : "Home";

  if (!data)
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.ivory, fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: C.burgundy }}>
        Opening your home…
      </div>
    );

  const me = data.activeUser;
  const partner = me === P1 ? P2 : P1;
  const activity = data.activity || [];
  const unread = activity.filter((a) => a.by !== me && !(a.seenBy || []).includes(me));
  const openAlerts = () => {
    if (unread.length)
      commit({ ...data, activity: activity.map((a) => ((a.seenBy || []).includes(me) ? a : { ...a, seenBy: [...(a.seenBy || []), me] })) });
    navigate("Alerts");
  };

  // —— mutations (each one persists; most log activity for the partner) ——
  const withActivity = (d, text) => ({
    ...d,
    activity: [{ by: me, text, when: today(), seenBy: [me] }, ...(d.activity || [])].slice(0, 50),
  });
  const setMood = (m) =>
    commit(withActivity(
      { ...data, moods: { ...data.moods, [me]: m } },
      `${me} is feeling ${MOODS.find((x) => x.key === m)?.label.toLowerCase()} today`
    ));
  const setUser = (u) => commit({ ...data, activeUser: u });
  const addJournal = (kind, text) =>
    commit(withActivity(
      { ...data, journal: [{ kind, by: me, when: today(), text }, ...data.journal] },
      `${me} added a ${kind.toLowerCase()} to the journal`
    ));
  const addTimeline = (item) =>
    commit(withActivity(
      { ...data, timeline: [...data.timeline, item] },
      `${me} placed “${item.title}” on the timeline`
    ));
  const bumpGoal = (scope, i, delta) => {
    const list = data.goals[scope].map((g, j) => (j === i ? { ...g, pct: Math.max(0, Math.min(100, g.pct + delta)) } : g));
    commit({ ...data, goals: { ...data.goals, [scope]: list } });
  };
  const addGoal = (scope, name) =>
    commit(withActivity(
      { ...data, goals: { ...data.goals, [scope]: [...data.goals[scope], { name, pct: 0, color: scope === "shared" ? C.gold : C.emerald }] } },
      `${me} set a new ${scope === "shared" ? "shared " : ""}goal: “${name}”`
    ));
  const toggleHabit = (i) => {
    const h = data.habits[i];
    const next = { ...data, habits: data.habits.map((x, j) => (j === i ? { ...x, done: !x.done } : x)) };
    commit(!h.done ? withActivity(next, `${me} completed “${h.name}”`) : next);
  };
  const addHabit = (name) => commit({ ...data, habits: [...data.habits, { name, done: false }] });
  const contribute = (i, amount) =>
    commit(withActivity(
      { ...data, funds: data.funds.map((f, j) => (j === i ? { ...f, saved: f.saved + amount } : f)) },
      `${me} contributed ${fmtR(amount)} to the ${data.funds[i].name}`
    ));
  const sendNote = (text) =>
    commit(withActivity(
      { ...data, notes: [{ from: me, to: partner, text, when: today() }, ...(data.notes || [])] },
      `${me} sent a love note ♡ “${text}”`
    ));
  const addCapsule = (c) =>
    commit(withActivity(
      { ...data, capsules: [...(data.capsules || []), c] },
      `${me} sealed a time capsule — it unlocks on ${c.unlockDate}`
    ));
  const openCapsule = (i) =>
    commit(withActivity(
      { ...data, capsules: (data.capsules || []).map((c, j) => (j === i ? { ...c, opened: true } : c)) },
      `${me} opened the time capsule “${(data.capsules || [])[i].title}”`
    ));
  const togglePack = (i) =>
    commit({ ...data, packing: data.packing.map((p, j) => (j === i ? { ...p, done: !p.done } : p)) });
  const setDates = (metDate, anniversary) => commit({ ...data, metDate, anniversary });
  const finishInvite = () => {
    const t = [...data.timeline];
    t.push({ when: today(), title: "The invitation", note: `“${data.inviteAnswers[0]}” — ${P1}`, kind: "Milestone", past: true });
    commit({ ...data, coupled: true, timeline: t });
    setStack(["Home"]);
  };

  return (
    <div className="ss-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@400;500;600&display=swap');

        .ss-root { min-height: 100vh; background: ${C.ivory}; color: ${C.charcoal}; font-family: 'Inter', sans-serif; font-size: 15px; line-height: 1.55; padding: 0 18px 118px; }
        .ss-shell { max-width: 720px; margin: 0 auto; position: relative; }

        /* —— screen header —— */
        .ss-topbar { display: flex; align-items: center; justify-content: space-between; padding: 20px 0 6px; gap: 10px; min-height: 58px; }
        .ss-wordmark { font-family: 'Cormorant Garamond', serif; font-size: 20px; letter-spacing: .22em; text-transform: uppercase; color: ${C.burgundy}; }
        .ss-screen-title { font-family: 'Cormorant Garamond', serif; font-size: 20px; color: ${C.burgundy}; letter-spacing: .04em; }
        .ss-back { font: inherit; font-size: 13.5px; font-weight: 500; cursor: pointer; border: none; background: transparent; color: ${C.burgundy}; padding: 8px 10px 8px 0; margin: 8px 0 0; }
        .ss-back:hover { text-decoration: underline; }
        .ss-back:focus-visible { outline: 2px solid ${C.burgundy}; border-radius: 6px; }
        .ss-save { font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase; color: ${C.sage}; white-space: nowrap; }
        .ss-bell { position: relative; font: inherit; font-size: 16px; cursor: pointer; border: 1px solid ${C.charcoal}1f; background: ${C.ivory}; color: ${C.burgundy}; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .ss-bell:hover { border-color: ${C.burgundy}66; }
        .ss-bell:focus-visible { outline: 2px solid ${C.burgundy}; }
        .ss-badge { position: absolute; top: -4px; right: -4px; min-width: 16px; height: 16px; border-radius: 999px; background: ${C.burgundy}; color: ${C.ivory}; font-size: 10px; font-weight: 600; display: flex; align-items: center; justify-content: center; padding: 0 4px; }
        .ss-newbanner { display: block; width: 100%; text-align: left; font: inherit; cursor: pointer; border: 1px solid ${C.gold}; margin: 16px 0 0; }
        .ss-newbanner b { font-weight: 500; font-size: 14px; display: block; color: ${C.burgundy}; }
        .ss-newbanner small { color: ${C.charcoal}99; font-size: 12px; }
        .ss-rosecard { background: linear-gradient(150deg, #f7e4e8, ${C.linen} 70%); border: 1px solid ${C.rose}66; }

        .ss-switch { display: flex; border: 1px solid ${C.charcoal}1f; border-radius: 999px; overflow: hidden; }
        .ss-switch button { font: inherit; font-size: 12px; cursor: pointer; border: none; background: ${C.ivory}; color: ${C.charcoal}99; padding: 6px 12px; }
        .ss-switch button.on { background: ${C.gold}; color: ${C.burgundyDeep}; font-weight: 500; }
        .ss-switch button:focus-visible { outline: 2px solid ${C.burgundy}; outline-offset: -2px; }

        /* —— bottom tab bar (always visible) —— */
        .ss-bottom { position: fixed; left: 0; right: 0; bottom: 0; z-index: 50; background: ${C.ivory}f2; backdrop-filter: blur(12px); border-top: 1px solid ${C.gold}55; display: flex; justify-content: center; padding: 6px 6px calc(10px + env(safe-area-inset-bottom, 0px)); }
        .ss-bottom-inner { display: flex; width: 100%; max-width: 720px; }
        .ss-tab { flex: 1; font: inherit; cursor: pointer; border: none; background: transparent; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 7px 2px 5px; color: ${C.charcoal}80; border-radius: 14px; transition: color .2s; }
        .ss-tab i { font-style: normal; font-size: 17px; line-height: 1; }
        .ss-tab span { font-size: 10.5px; letter-spacing: .06em; }
        .ss-tab.on { color: ${C.burgundy}; }
        .ss-tab.on::after { content: ""; width: 4px; height: 4px; border-radius: 50%; background: ${C.gold}; margin-top: 1px; }
        .ss-tab:focus-visible { outline: 2px solid ${C.burgundy}; outline-offset: -2px; }

        .ss-center { max-width: 560px; margin: 0 auto; padding: 60px 0 30px; display: flex; flex-direction: column; align-items: center; }

        .ss-hero { padding: 26px 0 26px; }
        .ss-hero.slim { padding: 18px 0 18px; }
        .ss-greet { font-family: 'Cormorant Garamond', serif; font-weight: 500; font-size: clamp(30px, 6vw, 44px); line-height: 1.12; margin: 0; }
        .ss-greet.sm { font-size: clamp(25px, 5vw, 34px); }
        .ss-greet em { font-style: italic; color: ${C.burgundy}; }
        .ss-sub { margin-top: 10px; max-width: 580px; color: ${C.charcoal}cc; }
        .ss-days { display: flex; gap: 30px; margin-top: 22px; flex-wrap: wrap; }
        .ss-stat-num { font-family: 'Cormorant Garamond', serif; font-size: 32px; line-height: 1.05; }
        .ss-stat-label { font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: ${C.charcoal}80; margin-top: 5px; }
        .ss-muted { color: ${C.charcoal}99; font-size: 13.5px; }

        .ss-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 14px; }
        .col-5 { grid-column: span 5; } .col-6 { grid-column: span 6; } .col-7 { grid-column: span 7; } .col-12 { grid-column: span 12; }
        @media (max-width: 700px) { .col-5, .col-6, .col-7 { grid-column: span 12; } }

        .ss-card { background: ${C.linen}; border-radius: 20px; padding: 20px 22px; box-shadow: 0 1px 2px rgba(45,45,45,.03), 0 12px 32px rgba(109,46,70,.05); }
        .ss-card h3 { font-family: 'Cormorant Garamond', serif; font-weight: 600; font-size: 21px; margin: 0 0 6px; }
        .ss-kicker { font-size: 10.5px; letter-spacing: .16em; text-transform: uppercase; color: ${C.burgundy}b3; margin-bottom: 9px; }

        .ss-insight { background: linear-gradient(150deg, ${C.burgundy}, ${C.burgundyDeep}); color: ${C.ivory}; }
        .ss-insight h3 { color: ${C.ivory}; }
        .ss-insight .ss-kicker { color: ${C.gold}; }
        .ss-insight-quote { color: ${C.ivory}d9; font-family: 'Cormorant Garamond', serif; font-size: 18px; line-height: 1.45; margin: 4px 0 6px; }

        /* nav cards on Home */
        .ss-navcard { display: flex; align-items: center; gap: 14px; width: 100%; text-align: left; font: inherit; cursor: pointer; background: ${C.linen}; border: none; border-radius: 18px; padding: 16px 18px; box-shadow: 0 1px 2px rgba(45,45,45,.03), 0 10px 26px rgba(109,46,70,.05); transition: transform .2s, box-shadow .2s; }
        .ss-navcard:hover { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(45,45,45,.05), 0 14px 30px rgba(109,46,70,.08); }
        .ss-navcard:focus-visible { outline: 2px solid ${C.burgundy}; }
        .ss-navicon { width: 40px; height: 40px; border-radius: 12px; background: ${C.ivory}; border: 1px solid ${C.gold}55; display: flex; align-items: center; justify-content: center; font-size: 17px; color: ${C.burgundy}; flex-shrink: 0; }
        .ss-navcard b { display: block; font-weight: 500; font-size: 14.5px; }
        .ss-navcard small { color: ${C.charcoal}99; font-size: 12.5px; line-height: 1.4; display: block; }
        .ss-chev { margin-left: auto; color: ${C.gold}; font-size: 18px; }
        .ss-navlist { display: flex; flex-direction: column; gap: 10px; }

        .ss-btn { font: inherit; font-size: 13.5px; font-weight: 500; cursor: pointer; border-radius: 999px; padding: 11px 20px; border: 1px solid ${C.gold}; background: transparent; color: ${C.burgundy}; transition: background .25s, color .25s; }
        .ss-btn:hover:not(:disabled) { background: ${C.gold}; color: ${C.burgundyDeep}; }
        .ss-btn:focus-visible { outline: 2px solid ${C.burgundy}; outline-offset: 2px; }
        .ss-btn.solid { background: ${C.burgundy}; border-color: ${C.burgundy}; color: ${C.ivory}; }
        .ss-btn.solid:hover:not(:disabled) { background: ${C.burgundyDeep}; color: ${C.ivory}; }
        .ss-btn.danger { border-color: ${C.charcoal}33; color: ${C.charcoal}99; }
        .ss-btn.danger:hover { background: ${C.charcoal}0d; color: ${C.charcoal}; }
        .ss-btn.tiny { padding: 6px 13px; font-size: 12px; }

        .ss-moods { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
        .ss-mood { font: inherit; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 7px; border: 1px solid ${C.charcoal}1f; background: ${C.ivory}; color: ${C.charcoal}; border-radius: 999px; padding: 7px 14px; transition: border-color .25s, background .25s; }
        .ss-mood:hover { border-color: ${C.burgundy}66; }
        .ss-mood:focus-visible { outline: 2px solid ${C.burgundy}; outline-offset: 2px; }
        .ss-mood.sel { border-color: ${C.burgundy}; background: ${C.burgundy}0d; }
        .ss-dot { width: 8px; height: 8px; border-radius: 50%; }

        .ss-goal { margin-top: 14px; }
        .ss-goal-head { display: flex; justify-content: space-between; align-items: center; font-size: 13.5px; margin-bottom: 7px; gap: 8px; }
        .ss-goal-head .pct { color: ${C.charcoal}80; font-size: 12.5px; }
        .ss-bar { height: 6px; border-radius: 999px; background: ${C.ivory}; overflow: hidden; }
        .ss-bar i { display: block; height: 100%; border-radius: 999px; transition: width .8s cubic-bezier(.22,.61,.36,1); }
        .ss-steppers { display: flex; gap: 4px; }
        .ss-step { font: inherit; width: 27px; height: 27px; border-radius: 50%; border: 1px solid ${C.charcoal}26; background: ${C.ivory}; cursor: pointer; font-size: 13px; line-height: 1; color: ${C.charcoal}; }
        .ss-step:hover { border-color: ${C.burgundy}; }
        .ss-step:focus-visible { outline: 2px solid ${C.burgundy}; }

        .ss-input { width: 100%; box-sizing: border-box; font: inherit; font-size: 14px; color: ${C.charcoal}; background: ${C.ivory}; border: 1px solid ${C.charcoal}1f; border-radius: 14px; padding: 12px 14px; margin: 6px 0 12px; resize: vertical; }
        .ss-input:focus { outline: 2px solid ${C.burgundy}66; }
        .ss-inline { display: flex; gap: 8px; }
        .ss-inline .ss-input { margin: 0; flex: 1; }

        .ss-tl { position: relative; padding-left: 24px; margin-top: 18px; }
        .ss-tl::before { content: ""; position: absolute; left: 3px; top: 8px; bottom: 8px; width: 1px; background: linear-gradient(${C.gold}, ${C.gold} 60%, ${C.gold}44); }
        .ss-tl-item { position: relative; margin-bottom: 14px; }
        .ss-tl-dot { position: absolute; left: -25px; top: 24px; width: 8px; height: 8px; border-radius: 50%; background: ${C.gold}; box-shadow: 0 0 0 4px ${C.gold}22; }
        .ss-tl-item.future .ss-tl-dot { background: ${C.ivory}; border: 1.5px solid ${C.gold}; }
        .ss-tl-item.future .ss-tl-card { background: ${C.ivory}; border: 1px dashed ${C.gold}88; box-shadow: none; }
        .ss-tl-when { font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: ${C.charcoal}80; margin-bottom: 6px; }
        .ss-tl-kind { color: ${C.burgundy}; }
        .ss-tl-card p { margin: 2px 0 0; }

        .ss-entry { margin-bottom: 12px; }
        .ss-entry-text { font-family: 'Cormorant Garamond', serif; font-size: 18px; line-height: 1.5; margin: 4px 0 0; }

        .ss-habits { display: flex; flex-direction: column; gap: 8px; margin-top: 6px; }
        .ss-habit { font: inherit; font-size: 14px; text-align: left; cursor: pointer; display: flex; align-items: center; gap: 12px; border: 1px solid ${C.charcoal}14; background: ${C.ivory}; color: ${C.charcoal}; border-radius: 14px; padding: 11px 14px; transition: border-color .2s; }
        .ss-habit:hover { border-color: ${C.emerald}88; }
        .ss-habit:focus-visible { outline: 2px solid ${C.emerald}; outline-offset: 1px; }
        .ss-habit.done { color: ${C.charcoal}80; }
        .ss-check { width: 22px; height: 22px; border-radius: 50%; border: 1.5px solid ${C.emerald}88; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; color: ${C.ivory}; flex-shrink: 0; }
        .ss-habit.done .ss-check { background: ${C.emerald}; border-color: ${C.emerald}; }

        .ss-funds { display: flex; flex-direction: column; gap: 18px; }
        .ss-fund { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
        .ss-fund b { font-weight: 500; display: block; }

        .ss-letter-wrap { display: flex; justify-content: center; padding: 40px 0 20px; }
        .ss-envelope { position: relative; width: min(380px, 92vw); height: 240px; background: ${C.linen}; border: 1px solid ${C.gold}66; border-radius: 10px; cursor: pointer; box-shadow: 0 24px 60px rgba(109,46,70,.12); }
        .ss-envelope:focus-visible { outline: 2px solid ${C.burgundy}; outline-offset: 4px; }
        .ss-env-flap { position: absolute; inset: 0 0 auto 0; height: 0; border-left: calc(min(380px, 92vw)/2) solid transparent; border-right: calc(min(380px, 92vw)/2) solid transparent; border-top: 118px solid ${C.ivory}; filter: drop-shadow(0 2px 3px rgba(45,45,45,.06)); }
        .ss-seal { position: absolute; left: 50%; top: 96px; transform: translateX(-50%); width: 60px; height: 60px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #8a4560, ${C.burgundy} 60%, ${C.burgundyDeep}); color: ${C.gold}; display: flex; align-items: center; justify-content: center; font-family: 'Cormorant Garamond', serif; font-size: 21px; box-shadow: 0 4px 10px rgba(79,32,51,.4); transition: transform .3s; }
        .ss-envelope:hover .ss-seal { transform: translateX(-50%) scale(1.06); }
        .ss-env-name { position: absolute; bottom: 20px; width: 100%; text-align: center; font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 17px; color: ${C.burgundy}; }
        .ss-letter { width: min(560px, 94vw); background: ${C.linen}; border: 1px solid ${C.gold}44; border-radius: 6px; padding: clamp(26px, 6vw, 48px); box-shadow: 0 30px 70px rgba(109,46,70,.14); animation: unfold .9s cubic-bezier(.22,.61,.36,1); }
        @keyframes unfold { from { opacity: 0; transform: translateY(24px) scale(.97); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .ss-letter { animation: none; } }
        .ss-letter-head { font-family: 'Cormorant Garamond', serif; font-size: clamp(25px, 4.5vw, 32px); line-height: 1.2; color: ${C.burgundy}; margin-bottom: 20px; }
        .ss-letter-body p { font-family: 'Cormorant Garamond', serif; font-size: 18.5px; line-height: 1.55; margin: 0 0 15px; }
        .ss-letter-sign { font-style: italic; color: ${C.burgundy}; }

        .ss-stars { position: relative; height: 100px; width: 100%; max-width: 360px; margin: 0 auto 24px; }
        .star { position: absolute; top: 50%; width: 14px; height: 14px; border-radius: 50%; background: ${C.gold}; box-shadow: 0 0 24px 6px ${C.gold}66; }
        .star.a { left: 8%; animation: driftA 2.4s cubic-bezier(.22,.61,.36,1) forwards; }
        .star.b { right: 8%; animation: driftB 2.4s cubic-bezier(.22,.61,.36,1) forwards; }
        .thread-line { position: absolute; top: calc(50% + 6px); left: 50%; height: 1px; width: 0; background: ${C.gold}; transform: translateX(-50%); animation: thread 1.6s .9s ease forwards; }
        @keyframes driftA { to { left: calc(50% - 16px); } }
        @keyframes driftB { to { right: calc(50% - 16px); } }
        @keyframes thread { to { width: 60%; opacity: .5; } }
        @media (prefers-reduced-motion: reduce) { .star.a { left: calc(50% - 16px); animation: none; } .star.b { right: calc(50% - 16px); animation: none; } .thread-line { width: 60%; opacity: .5; animation: none; } }
      `}</style>

      <div className="ss-shell">
        {!data.coupled ? (
          <InviteJourney
            answers={data.inviteAnswers}
            onAnswers={(a) => commit({ ...data, inviteAnswers: a })}
            onComplete={finishInvite}
          />
        ) : (
          <>
            {/* —— screen header: back on subscreens, brand on Home —— */}
            <header className="ss-topbar">
              {screen === "Home" ? (
                <div className="ss-wordmark">SoulSync</div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <button className="ss-back" style={{ margin: 0 }} onClick={goBack} aria-label="Go back">←</button>
                  <span className="ss-screen-title">{screen}</span>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button className="ss-bell" onClick={openAlerts} aria-label={`Notifications${unread.length ? `, ${unread.length} unread` : ""}`}>
                  ♡
                  {unread.length > 0 && <span className="ss-badge">{unread.length}</span>}
                </button>
                <div className="ss-switch" role="group" aria-label="Who is using the app">
                  {[P1, P2].map((u) => (
                    <button key={u} className={me === u ? "on" : ""} onClick={() => setUser(u)} aria-pressed={me === u}>{u}</button>
                  ))}
                </div>
                <span className="ss-save" aria-live="polite">{saving ? "Saving…" : "Saved ✓"}</span>
              </div>
            </header>

            {/* ——— HOME: greeting + companion + quick status + all rooms ——— */}
            {screen === "Home" && (
              <>
                {unread.length > 0 && (
                  <button className="ss-card ss-newbanner" onClick={openAlerts}>
                    <b>♡ {unread[0].text}</b>
                    <small>{unread.length > 1 ? `and ${unread.length - 1} more — tap to see` : "Tap to see"}</small>
                  </button>
                )}
                <section className="ss-hero">
                  <h1 className="ss-greet">Welcome home, <em>{me}</em>.</h1>
                  <p className="ss-sub">
                    {data.moods[partner]
                      ? `${partner} is feeling ${MOODS.find((m) => m.key === data.moods[partner])?.label.toLowerCase()} today.`
                      : `${partner} hasn't shared a mood yet today.`}
                  </p>
                  <div className="ss-days">
                    <div><div className="ss-stat-num">{days(data.metDate).toLocaleString()}</div><div className="ss-stat-label">Days together</div></div>
                    <div><div className="ss-stat-num">{toAnniv(data.anniversary)}</div><div className="ss-stat-label">To anniversary</div></div>
                    <div><div className="ss-stat-num">{data.timeline.length}</div><div className="ss-stat-label">Moments</div></div>
                  </div>
                </section>

                <div className="ss-grid" style={{ marginBottom: 16 }}>
                  <section className="ss-card ss-insight col-12">
                    <Kicker>From your companion</Kicker>
                    <p className="ss-insight-quote">
                      {data.habits.every((h) => h.done)
                        ? "All of this week's habits are done — that deserves a celebration. Plan something small for tonight?"
                        : data.journal.length === 0
                        ? "Your journal is still empty. The first entry is the hardest — one honest sentence is enough."
                        : "Your story is growing. Is there a moment from this week that belongs on the timeline?"}
                    </p>
                  </section>
                  <section className="ss-card col-12">
                    <Kicker>How are you feeling, {me}?</Kicker>
                    <div className="ss-moods" role="group" aria-label="Set your mood">
                      {MOODS.map((m) => (
                        <button key={m.key} className={`ss-mood ${data.moods[me] === m.key ? "sel" : ""}`}
                          onClick={() => setMood(m.key)} aria-pressed={data.moods[me] === m.key}>
                          <span className="ss-dot" style={{ background: m.dot }} />{m.label}
                        </button>
                      ))}
                    </div>
                  </section>
                  <LoveNoteCard partner={partner} notes={data.notes || []} me={me} onSend={sendNote} />
                </div>

                <Kicker>Your home</Kicker>
                <div className="ss-navlist">
                  {Object.entries(SECTIONS).map(([name, desc]) => (
                    <button key={name} className="ss-navcard" onClick={() => navigate(name)}>
                      <span className="ss-navicon">{SECTION_ICONS[name]}</span>
                      <span>
                        <b>{name}</b>
                        <small>{desc}</small>
                      </span>
                      <span className="ss-chev">›</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* ——— ALERTS: what your partner has been doing ——— */}
            {screen === "Alerts" && (
              <>
                <section className="ss-hero slim">
                  <h1 className="ss-greet sm">While you were <em>away</em></h1>
                  <p className="ss-sub">Everything {partner} adds shows up here the moment you open the app — memories, journal entries, goals, contributions.</p>
                </section>
                {activity.length === 0 ? (
                  <div className="ss-card">
                    <p className="ss-muted" style={{ margin: 0 }}>Nothing yet. When either of you adds something, the other will see it here — like “{partner} placed a memory on the timeline.”</p>
                  </div>
                ) : (
                  <div className="ss-navlist">
                    {activity.map((a, i) => (
                      <div className="ss-card" key={i} style={{ padding: "14px 18px" }}>
                        <div className="ss-tl-when">{a.when}{a.by === me ? " · you" : ""}</div>
                        <p style={{ margin: 0, fontSize: 14 }}>{a.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ——— CAPSULES: letters sealed until a future date ——— */}
            {screen === "Capsules" && (
              <>
                <section className="ss-hero slim">
                  <h1 className="ss-greet sm">Time <em>capsules</em></h1>
                  <p className="ss-sub">Seal a letter today — it can only be opened on the date you choose. Not even the person who wrote it can peek early.</p>
                </section>
                <CapsuleForm onAdd={addCapsule} me={me} />
                <div className="ss-navlist" style={{ marginTop: 16 }}>
                  {(data.capsules || []).length === 0 && (
                    <div className="ss-card"><p className="ss-muted" style={{ margin: 0 }}>No capsules yet. Try sealing one for your anniversary — future-you will thank you.</p></div>
                  )}
                  {(data.capsules || []).map((c, i) => {
                    const unlockable = new Date(c.unlockDate + "T00:00:00") <= new Date();
                    const wait = Math.max(0, Math.ceil((new Date(c.unlockDate + "T00:00:00") - new Date()) / 864e5));
                    return (
                      <div className="ss-card" key={i}>
                        <div className="ss-tl-when">Sealed by {c.by} · {c.created} · unlocks {c.unlockDate}</div>
                        <h3>{c.title}</h3>
                        {c.opened ? (
                          <p className="ss-entry-text">“{c.text}”</p>
                        ) : unlockable ? (
                          <button className="ss-btn solid" onClick={() => openCapsule(i)}>Break the seal ✦</button>
                        ) : (
                          <p className="ss-muted" style={{ margin: 0 }}>
                            Sealed — {wait} day{wait === 1 ? "" : "s"} to go. Not even {c.by === me ? "you" : c.by} can open it early.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* ——— MORE: the overflow rooms ——— */}
            {screen === "More" && (
              <>
                <section className="ss-hero slim">
                  <h1 className="ss-greet sm">More of <em>your home</em></h1>
                </section>
                <div className="ss-navlist">
                  {["Capsules", "Finance", "Travel", "Us"].map((name) => (
                    <button key={name} className="ss-navcard" onClick={() => navigate(name)}>
                      <span className="ss-navicon">{SECTION_ICONS[name]}</span>
                      <span>
                        <b>{name}</b>
                        <small>{SECTIONS[name]}</small>
                      </span>
                      <span className="ss-chev">›</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* ——— TIMELINE ——— */}
            {screen === "Timeline" && (
              <>
                <section className="ss-hero slim">
                  <h1 className="ss-greet sm">Your <em>living timeline</em></h1>
                  <p className="ss-sub">Past memories and future dreams on one thread.</p>
                </section>
                <TimelineForm onAdd={addTimeline} me={me} />
                <div className="ss-tl">
                  {[...data.timeline].reverse().map((t, i) => (
                    <div className={`ss-tl-item ${t.past ? "" : "future"}`} key={t.when + t.title + i}>
                      <span className="ss-tl-dot" />
                      <div className="ss-card ss-tl-card">
                        <div className="ss-tl-when">{t.when} · <span className="ss-tl-kind">{t.past ? t.kind : `${t.kind} · ahead`}</span></div>
                        <h3>{t.title}</h3>
                        {t.note && <p className="ss-muted">{t.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ——— JOURNAL ——— */}
            {screen === "Journal" && (
              <>
                <section className="ss-hero slim">
                  <h1 className="ss-greet sm">Couple <em>journal</em></h1>
                  <p className="ss-sub">Writing as {me}. Private to the two of you — and kept.</p>
                </section>
                <div className="ss-grid">
                  <JournalForm onAdd={addJournal} partner={partner} />
                  <section className="col-7">
                    {data.journal.length === 0 && (
                      <div className="ss-card"><p className="ss-muted" style={{ margin: 0 }}>No entries yet. The first page of a journal is an invitation, not a demand.</p></div>
                    )}
                    {data.journal.map((e, i) => (
                      <div className="ss-card ss-entry" key={i}>
                        <div className="ss-tl-when">{e.kind} · {e.by} · {e.when}</div>
                        <p className="ss-entry-text">{e.text}</p>
                      </div>
                    ))}
                  </section>
                </div>
              </>
            )}

            {/* ——— GOALS ——— */}
            {screen === "Goals" && (
              <>
                <section className="ss-hero slim">
                  <h1 className="ss-greet sm">Goals & <em>habits</em></h1>
                  <p className="ss-sub">Nudge progress with − and +. Saved as you go.</p>
                </section>
                <div className="ss-grid">
                  {[
                    { scope: "shared", label: "Shared", col: "col-12" },
                    { scope: P1, label: P1, col: "col-6" },
                    { scope: P2, label: P2, col: "col-6" },
                  ].map(({ scope, label, col }) => (
                    <section className={`ss-card ${col}`} key={scope}>
                      <Kicker>{label}</Kicker>
                      {data.goals[scope].map((g, i) => (
                        <div className="ss-goal" key={g.name + i}>
                          <div className="ss-goal-head">
                            <span>{g.name}</span>
                            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span className="pct">{g.pct}%</span>
                              <span className="ss-steppers">
                                <button className="ss-step" onClick={() => bumpGoal(scope, i, -5)} aria-label={`Decrease ${g.name}`}>−</button>
                                <button className="ss-step" onClick={() => bumpGoal(scope, i, 5)} aria-label={`Increase ${g.name}`}>+</button>
                              </span>
                            </span>
                          </div>
                          <Bar pct={g.pct} color={g.color} />
                        </div>
                      ))}
                      <AddInline placeholder={`New ${label.toLowerCase()} goal…`} onAdd={(v) => addGoal(scope, v)} />
                    </section>
                  ))}
                  <section className="ss-card col-12">
                    <Kicker>This week's habits</Kicker>
                    <div className="ss-habits">
                      {data.habits.map((h, i) => (
                        <button key={h.name + i} className={`ss-habit ${h.done ? "done" : ""}`} onClick={() => toggleHabit(i)} aria-pressed={h.done}>
                          <span className="ss-check">{h.done ? "✓" : ""}</span>{h.name}
                        </button>
                      ))}
                    </div>
                    <AddInline placeholder="New habit…" onAdd={addHabit} />
                  </section>
                </div>
              </>
            )}

            {/* ——— FINANCE ——— */}
            {screen === "Finance" && (
              <>
                <section className="ss-hero slim">
                  <h1 className="ss-greet sm">Finance <em>hub</em></h1>
                  <p className="ss-sub">Money as teamwork. Log a contribution and watch the rings move.</p>
                </section>
                <div className="ss-grid">
                  <section className="ss-card col-12">
                    <Kicker>Shared funds</Kicker>
                    <div className="ss-funds">
                      {data.funds.map((f, i) => (
                        <FundRow key={f.name} fund={f} onContribute={(amt) => contribute(i, amt)} />
                      ))}
                    </div>
                  </section>
                  <section className="ss-card col-12">
                    <Kicker>Companion suggestion</Kicker>
                    <p className="ss-muted" style={{ margin: 0 }}>
                      {(() => {
                        const closest = [...data.funds].sort((a, b) => (b.saved / b.target) - (a.saved / a.target))[0];
                        const left = closest.target - closest.saved;
                        return left <= 0
                          ? `The ${closest.name} is complete — that's a milestone worth celebrating properly.`
                          : `You're closest on the ${closest.name}: ${fmtR(left)} to go. Even ${fmtR(500)} today keeps the momentum.`;
                      })()}
                    </p>
                  </section>
                </div>
              </>
            )}

            {/* ——— TRAVEL ——— */}
            {screen === "Travel" && (
              <>
                <section className="ss-hero slim">
                  <h1 className="ss-greet sm">Travel <em>together</em></h1>
                  <p className="ss-sub">The packing list remembers what you've ticked.</p>
                </section>
                <div className="ss-grid">
                  <section className="ss-card ss-insight col-12">
                    <Kicker>Next trip</Kicker>
                    <h3 style={{ fontSize: 26 }}>Santorini, Greece</h3>
                    <p className="ss-insight-quote" style={{ fontSize: 16 }}>
                      Travel fund at {Math.round((data.funds[0].saved / data.funds[0].target) * 100)}% — top it up in Finance.
                    </p>
                    <button className="ss-btn" onClick={() => navigate("Finance")}>Open Finance →</button>
                  </section>
                  <section className="ss-card col-12">
                    <Kicker>Packing list</Kicker>
                    <div className="ss-habits">
                      {data.packing.map((p, i) => (
                        <button key={p.name + i} className={`ss-habit ${p.done ? "done" : ""}`} onClick={() => togglePack(i)} aria-pressed={p.done}>
                          <span className="ss-check">{p.done ? "✓" : ""}</span>{p.name}
                        </button>
                      ))}
                    </div>
                    <AddInline placeholder="Add to packing list…" onAdd={(v) => commit({ ...data, packing: [...data.packing, { name: v, done: false }] })} />
                  </section>
                </div>
              </>
            )}

            {/* ——— US (settings) ——— */}
            {screen === "Us" && (
              <>
                <section className="ss-hero slim">
                  <h1 className="ss-greet sm">Mpho & <em>Konanani</em></h1>
                  <p className="ss-sub">Your story's important dates, and the keys to this home.</p>
                </section>
                <div className="ss-grid">
                  <section className="ss-card col-6">
                    <Kicker>The day you met</Kicker>
                    <input type="date" className="ss-input" value={data.metDate}
                      onChange={(e) => setDates(e.target.value, data.anniversary)} aria-label="The day you met" />
                    <p className="ss-muted">Drives your "days together" counter.</p>
                  </section>
                  <section className="ss-card col-6">
                    <Kicker>Your anniversary</Kicker>
                    <input type="date" className="ss-input" value={data.anniversary}
                      onChange={(e) => setDates(data.metDate, e.target.value)} aria-label="Your anniversary" />
                    <p className="ss-muted">Drives the anniversary countdown.</p>
                  </section>
                  <section className="ss-card col-12">
                    <Kicker>The invitation that started it</Kicker>
                    <p className="ss-entry-text">“{data.inviteAnswers[0]}”</p>
                    <p className="ss-muted" style={{ marginTop: 8 }}>— {P1}, from the invitation letter</p>
                  </section>
                  <section className="ss-card col-12">
                    <Kicker>Start over</Kicker>
                    <p className="ss-muted">This erases everything — the invitation, the timeline, the journal, all of it. There's no undo.</p>
                    <ResetButton onReset={async () => { await wipeData(); setData({ ...DEFAULT_DATA }); setStack(["Home"]); }} />
                  </section>
                </div>
              </>
            )}

            {/* —— fixed bottom navigation, always visible —— */}
            <nav className="ss-bottom" aria-label="Main navigation">
              <div className="ss-bottom-inner">
                {TABS.map((t) => (
                  <button key={t} className={`ss-tab ${activeTab === t ? "on" : ""}`} onClick={() => tabTap(t)}
                    aria-current={activeTab === t ? "page" : undefined}>
                    <i aria-hidden="true">{TAB_ICONS[t]}</i>
                    <span>{t}</span>
                  </button>
                ))}
              </div>
            </nav>
          </>
        )}
      </div>
    </div>
  );
}

// —— small form components ————————————————————————————————————————
function AddInline({ placeholder, onAdd }) {
  const [v, setV] = useState("");
  return (
    <div className="ss-inline" style={{ marginTop: 14 }}>
      <input className="ss-input" value={v} placeholder={placeholder} onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && v.trim()) { onAdd(v.trim()); setV(""); } }} />
      <button className="ss-btn tiny" onClick={() => { if (v.trim()) { onAdd(v.trim()); setV(""); } }}>Add</button>
    </div>
  );
}

function TimelineForm({ onAdd, me }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [future, setFuture] = useState(false);
  const submit = () => {
    if (!title.trim()) return;
    onAdd({
      when: future ? "Someday" : today(),
      title: title.trim(),
      note: note.trim() ? `${note.trim()} — ${me}` : "",
      kind: future ? "Dream" : "Memory",
      past: !future,
    });
    setTitle(""); setNote(""); setOpen(false);
  };
  if (!open)
    return <button className="ss-btn solid" onClick={() => setOpen(true)}>＋ Add a memory or dream</button>;
  return (
    <section className="ss-card" style={{ marginTop: 8 }}>
      <Kicker>Add to the thread</Kicker>
      <div className="ss-moods" style={{ marginBottom: 10 }}>
        <button className={`ss-mood ${!future ? "sel" : ""}`} onClick={() => setFuture(false)}>A memory (past)</button>
        <button className={`ss-mood ${future ? "sel" : ""}`} onClick={() => setFuture(true)}>A dream (future)</button>
      </div>
      <input className="ss-input" placeholder={future ? "One day we will…" : "What happened?"} value={title} onChange={(e) => setTitle(e.target.value)} />
      <input className="ss-input" placeholder="A line to remember it by (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      <div style={{ display: "flex", gap: 8 }}>
        <button className="ss-btn solid" onClick={submit}>Place it on the timeline</button>
        <button className="ss-btn" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </section>
  );
}

function JournalForm({ onAdd, partner }) {
  const [kind, setKind] = useState("Reflection");
  const [text, setText] = useState("");
  return (
    <section className="ss-card col-5" style={{ alignSelf: "start" }}>
      <Kicker>New entry</Kicker>
      <div className="ss-moods" style={{ marginBottom: 12 }}>
        {["Reflection", "Gratitude", "Letter"].map((k) => (
          <button key={k} className={`ss-mood ${kind === k ? "sel" : ""}`} onClick={() => setKind(k)}>{k}</button>
        ))}
      </div>
      <textarea className="ss-input" rows={5} value={text} onChange={(e) => setText(e.target.value)}
        placeholder={kind === "Gratitude" ? "Today I'm grateful for…" : kind === "Letter" ? `Dear ${partner}…` : "What's on your heart?"} />
      <button className="ss-btn solid" onClick={() => { if (text.trim()) { onAdd(kind, text.trim()); setText(""); } }}>
        Add to your story
      </button>
    </section>
  );
}

function FundRow({ fund, onContribute }) {
  const [amt, setAmt] = useState("");
  const pct = Math.round((fund.saved / fund.target) * 100);
  return (
    <div className="ss-fund">
      <Ring pct={pct} label={fund.name} />
      <div style={{ minWidth: 160 }}>
        <b>{fund.name}</b>
        <span className="ss-muted">{fmtR(fund.saved)} of {fmtR(fund.target)}</span>
      </div>
      <div className="ss-inline" style={{ flex: 1, minWidth: 210 }}>
        <input className="ss-input" type="number" min="1" placeholder="Amount (R)" value={amt} onChange={(e) => setAmt(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && +amt > 0) { onContribute(Math.round(+amt)); setAmt(""); } }} />
        <button className="ss-btn tiny" onClick={() => { if (+amt > 0) { onContribute(Math.round(+amt)); setAmt(""); } }}>Contribute</button>
      </div>
    </div>
  );
}

function LoveNoteCard({ partner, notes, me, onSend }) {
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const latest = notes.find((n) => n.to === me);
  const quick = ["Thinking of you", "Miss you", "So proud of you", "Can't wait to see you"];
  const send = (t) => { onSend(t); setText(""); setSent(true); setTimeout(() => setSent(false), 2500); };
  return (
    <section className="ss-card col-12 ss-rosecard">
      <Kicker>Send {partner} a love note ♡</Kicker>
      <div className="ss-moods" style={{ marginBottom: 10 }}>
        {quick.map((q) => (
          <button key={q} className="ss-mood" onClick={() => send(q)}>{q} ♡</button>
        ))}
      </div>
      <div className="ss-inline">
        <input className="ss-input" placeholder="Or write your own…" value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && text.trim()) send(text.trim()); }} />
        <button className="ss-btn tiny" onClick={() => text.trim() && send(text.trim())}>Send</button>
      </div>
      {sent && <p className="ss-muted" style={{ marginTop: 10 }}>Sent ♡ — {partner} will see it the moment they open the app.</p>}
      {latest && (
        <p className="ss-entry-text" style={{ marginTop: 14 }}>
          “{latest.text}”
          <span style={{ display: "block", fontFamily: "'Inter', sans-serif", fontSize: 12, color: "#2D2D2D99", marginTop: 4 }}>
            — the latest note from {partner}, {latest.when}
          </span>
        </p>
      )}
    </section>
  );
}

function CapsuleForm({ onAdd, me }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [date, setDate] = useState("");
  const seal = () => {
    if (!title.trim() || !text.trim() || !date) return;
    onAdd({ title: title.trim(), text: text.trim(), by: me, created: today(), unlockDate: date, opened: false });
    setTitle(""); setText(""); setDate(""); setOpen(false);
  };
  if (!open) return <button className="ss-btn solid" onClick={() => setOpen(true)}>＋ Seal a new capsule</button>;
  return (
    <section className="ss-card" style={{ marginTop: 8 }}>
      <Kicker>New capsule — sealed by {me}</Kicker>
      <input className="ss-input" placeholder="Open when… (e.g. Our anniversary)" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea className="ss-input" rows={4} placeholder="Dear us…" value={text} onChange={(e) => setText(e.target.value)} />
      <label className="ss-muted" style={{ display: "block", marginBottom: 4 }}>Unlock date</label>
      <input type="date" className="ss-input" value={date} onChange={(e) => setDate(e.target.value)} />
      <div style={{ display: "flex", gap: 8 }}>
        <button className="ss-btn solid" onClick={seal}>Seal it ✦</button>
        <button className="ss-btn" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </section>
  );
}

function ResetButton({ onReset }) {
  const [confirm, setConfirm] = useState(false);
  if (!confirm)
    return <button className="ss-btn danger" onClick={() => setConfirm(true)}>Erase everything…</button>;
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <button className="ss-btn danger" onClick={onReset}>Yes, erase our data</button>
      <button className="ss-btn" onClick={() => setConfirm(false)}>Keep everything</button>
    </div>
  );
}
