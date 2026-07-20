# SoulSync — Gap Audit: What Makes People Fall In Love With This App

Going screen by screen against what's actually built, then against what makes
a relationship app become a daily habit instead of a week-two delete.

---

## 1. What's already built (the honest inventory)

| Area | Status |
|---|---|
| Invitation journey | Strong — letter, seal, acceptance, her side, his side |
| Home dashboard | Solid shell — mood, companion line, streaks, room list |
| Timeline | Working — memories + dreams, add flow |
| Journal | Working — reflection/gratitude/letter |
| Goals & habits | Working — shared + individual, steppers |
| Finance hub | Working — funds, contributions, rings |
| Travel | Working — packing list, trip card |
| Notifications | In-app only — bell, badge, banner, activity log |
| Love notes | Text only |
| Time capsules | Working — real date-locking |
| Navigation | Fixed — bottom tabs, back buttons, order |
| Presence / Thinking-Kiss-Hug | **Briefed, not built** |
| Voice notes | **Briefed, not built** |
| "On this day" | **Mocked, not built** |

This is a genuinely complete *skeleton*. Every room from your original spec
exists. What's missing isn't more rooms — it's what makes someone walk back
into the rooms you've already built, every single day, without being asked.

---

## 2. The real gap: nothing pulls you back tomorrow

Right now, every screen answers "what can I do here" but almost nothing
answers "why would I open this again in six hours." That's the single biggest
gap, and it's the one worth fixing before anything else.

### 2a. Onboarding stops too early
Your original spec has a whole **"Shared Vision Setup"** section — dream
destinations, values, traditions, love languages — asked as inspiring
questions right after acceptance. The prototype currently jumps from
"she accepted" straight to the empty dashboard. That's a missed moment:
the five minutes right after acceptance is when both of you are most
emotionally invested and most willing to answer real questions. Right now
that energy is spent and then wasted.

**Missing:** love language capture, 3–5 shared dream questions, "what makes
you feel loved" — feeding directly into smarter companion suggestions later.

### 2b. The companion is static, not personal
Right now the companion line on Home is a hand-picked sentence chosen by a
simple if/else on your data (habits done? journal empty?). That's fine as a
placeholder, but it's not what makes Amora- or Paired-style apps feel alive.
The real unlock is having Claude actually read your recent activity —
moods, journal tone, goal progress, love note frequency — and write one
genuinely specific line each day, not a templated one.

**Missing:** the actual `/api/companion` route from your blueprint, calling
Claude with real context, cached once daily. This is the single highest-
leverage thing to build next — it makes every other feature feel smarter
retroactively, because the same data now gets *interpreted*, not just stored.

### 2c. No daily habit loop / streak
Every sticky app in this category (and every habit app generally) has some
version of "don't break the chain." Right now nothing in SoulSync creates
that pull. Your own spec's idea — "Secret Missions... 365 flowers = one
magical garden" — is exactly this mechanic and it's still unbuilt.

**Missing:** one small daily prompt (from a static list of ~50 — "tell her
one thing you've never told her," "send a voice note right now"), completed
by both of you, growing a visible garden/constellation over the year.

### 2d. Nothing captures a moment in under 3 seconds
Journal entries, timeline moments, goals — all require opening a screen,
tapping a button, writing something. The features people actually use daily
in real relationships (per your own idea list) are the *zero-friction* ones:
Thinking of You, Kiss, Hug. These are the highest ratio of emotional payoff
to engineering effort you have available, and they're still just a brief,
not shipped.

**Missing:** ship the Presence & Touch brief. This alone will likely
generate more daily opens than everything else combined, because it removes
all friction between "I feel something" and "she knows."

### 2e. No visual memory — everything is text and color blocks
Your timeline, journal, and memories are currently represented with gradient
placeholder blocks, not real photos. A relationship app without real photos
of the actual relationship is asking a lot of two people's imagination.
This is real infrastructure work (Supabase Storage, upload UI, compression),
not a quick add — but it's probably the single biggest "does this feel real
or like a demo" gap.

**Missing:** photo upload on timeline entries and journal entries; even a
basic version (one photo per entry, no editing/filters) would transform how
alive the app feels.

### 2f. No re-engagement outside the app
Right now, if neither of you opens SoulSync for four days, nothing happens.
Real push notifications (not just the in-app bell) are what get you back —
love notes, capsule unlocks, and the companion's daily line should all be
capable of reaching a locked phone, per the Phase 1 blueprint's web-push
section. If this isn't live yet, it's the most important infrastructure
piece left.

**Missing:** confirm web push (VAPID) is actually wired end-to-end and
tested on both real phones — not just the in-app banner.

### 2g. Nothing shows growth over time (without being a "score")
You correctly rejected a Love Meter percentage as risky. But the *good*
version of that idea — visible proof that the archive is growing — doesn't
exist yet either. "On this day" is mocked but not wired to real data.

**Missing:** wire "On this day" to the real timeline; add the "Us in
numbers" idea (days together, thinking-of-you count, memories added,
capsules sealed) as one page — proof of accumulation without judgment.

---

## 3. Ranked build order — what actually moves the needle

If the goal is "people fall in love with this app," not "the spec is
complete," here's the order I'd build in, cheapest-and-highest-impact first:

1. **Presence & Touch** (brief already written) — the lowest-effort,
   highest-frequency feature you have. Ship this first.
2. **Real companion via Claude API** — makes every existing screen feel
   smarter for near-zero new UI work.
3. **Push notifications wired end-to-end** — without this, nothing else
   matters once the novelty of opening the app daily wears off.
4. **Shared Vision onboarding** (love language + shared dreams) — five
   more minutes at the most emotionally primed moment, feeding the
   companion and goal-merging logic you already designed.
5. **Daily mission + flower garden** — the "don't break the chain" loop.
6. **Photos on timeline/journal** — bigger lift, but the ceiling on how
   real the app feels depends on this.
7. **"On this day" wired to real data + "Us in numbers" page** — the
   payoff view that rewards months of use, which is also your best
   argument for *why someone would pay* long-term.
8. **Voice notes** — you already scoped this; slot it in here.

Notice what's *not* on this list yet: Love Story Movie, Our Sky, Heart
Distance, Future Children Letters. Not because they're bad — because none
of them change whether someone opens the app tomorrow. They're excellent
year-two features once the daily habit already exists.

---

## 4. The one-sentence test

For anything new you're tempted to add, ask: **"Does this give either of us
a reason to open the app in the next 6 hours, or does it just add a room to
a house nobody's walking through yet?"** Everything in section 2 passes that
test. Almost everything still on your idea list (movies, constellations,
distance) doesn't — yet.
