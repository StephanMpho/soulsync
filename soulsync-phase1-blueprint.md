# SoulSync — Phase 1 Build Blueprint

A two-person production deployment: Mpho and Konanani, real accounts, real phones,
synced data, installable as a PWA. Everything designed in the prototype maps onto this.

---

## 1. Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind, Framer Motion | Matches the original spec; deploys to Vercel in minutes |
| Backend + DB | Supabase (PostgreSQL, Auth, Realtime, Storage) | Collapses backend, auth, database, live sync and photo storage into one free-tier service; RLS keeps data private |
| AI companion | Next.js API route calling the Claude API | Server-side only — the API key never reaches the browser |
| Notifications | Web Push (VAPID) via a Next.js API route; in-app activity feed as fallback | Android push works everywhere; iOS push works once the PWA is installed to the home screen |
| Scheduled jobs | Vercel Cron | Daily check for capsule unlocks and anniversary reminders |
| Hosting | Vercel | Free hobby tier is enough for two users |

Phase 2 (later): wrap with Capacitor for app-store distribution and native push;
introduce FastAPI if companion logic outgrows API routes.

---

## 2. Auth and couple pairing

1. Mpho signs up (email + password or magic link via Supabase Auth).
2. On first login he has no `couple_id`, so the app routes him into the invitation
   journey. His three answers are stored on an `invitations` row with a random token.
3. The app gives him a share link: `soulsync.app/invite/<token>` (send via WhatsApp).
4. Konanani opens the link — the sealed envelope and letter render from the token,
   no account needed to read it.
5. On "Accept invitation" she signs up; the accept handler joins her to the couple,
   marks the invitation accepted, and writes "The invitation" to the timeline.
6. Both users now share one `couple_id`. Every query in the app is scoped to it.

Route guard: signed in without a couple → invitation flow; with a couple → the app.

---

## 3. Database schema (PostgreSQL / Supabase)

```sql
create table couples (
  id uuid primary key default gen_random_uuid(),
  met_date date,
  anniversary date,
  created_at timestamptz default now()
);

create table profiles (              -- 1:1 with auth.users
  id uuid primary key references auth.users(id),
  couple_id uuid references couples(id),
  display_name text not null,
  love_language text,
  mood text,
  mood_updated_at timestamptz
);

create table invitations (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples(id),
  inviter_id uuid references profiles(id),
  token text unique not null,
  answers jsonb not null,            -- the three questions
  status text default 'sent',        -- sent | accepted
  created_at timestamptz default now()
);

create table timeline_events (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id),
  author_id uuid references profiles(id),
  title text not null,
  note text,
  kind text not null,                -- milestone | memory | trip | career | dream
  is_past boolean default true,
  event_date date,
  photo_url text,                    -- Supabase Storage path (Phase 1.5)
  created_at timestamptz default now()
);

create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id),
  author_id uuid not null references profiles(id),
  kind text not null,                -- reflection | gratitude | letter
  body text not null,
  created_at timestamptz default now()
);

create table goals (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id),
  owner_id uuid references profiles(id),  -- null = shared goal
  name text not null,
  pct int default 0 check (pct between 0 and 100),
  created_at timestamptz default now()
);

create table habits (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id),
  name text not null,
  done boolean default false         -- reset weekly by cron
);

create table funds (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id),
  name text not null,
  target_cents bigint not null,
  saved_cents bigint default 0
);

create table contributions (
  id uuid primary key default gen_random_uuid(),
  fund_id uuid not null references funds(id),
  user_id uuid not null references profiles(id),
  amount_cents bigint not null,
  created_at timestamptz default now()
);

create table capsules (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id),
  author_id uuid not null references profiles(id),
  title text not null,
  body text not null,
  unlock_date date not null,
  opened_at timestamptz              -- null while sealed
);

create table love_notes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id),
  from_id uuid not null references profiles(id),
  body text not null,
  created_at timestamptz default now()
);

create table activity (              -- powers notifications, exactly like the prototype
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id),
  actor_id uuid not null references profiles(id),
  type text not null,                -- note | memory | journal | goal | habit | fund | capsule_sealed | capsule_opened | mood
  payload jsonb not null,            -- e.g. { "text": "Mpho sent a love note ♡ …" }
  seen_by uuid[] default '{}',
  created_at timestamptz default now()
);

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  endpoint text not null,
  keys jsonb not null                -- p256dh + auth from the browser
);
```

### Row Level Security — the privacy guarantee

Enable RLS on every table. One policy pattern covers everything:

```sql
create policy "couple members only" on timeline_events
  for all using (
    couple_id = (select couple_id from profiles where id = auth.uid())
  );
```

Repeat per table. Two extra rules:
- `capsules`: a select policy hides `body` until `unlock_date <= current_date`
  (expose via a view or return body as null when still sealed).
- `invitations`: allow anonymous select by exact `token` so the letter renders
  before Konanani has an account.

---

## 4. Data access and API routes

Most reads/writes are direct Supabase client calls from the app — RLS is the
security layer, so no API wrapper is needed for CRUD.

Server routes (Next.js `app/api/`):

| Route | Purpose |
|---|---|
| `POST /api/invite/accept` | Joins the new user to the couple, marks invitation accepted, seeds the timeline (service-role key, transactional) |
| `POST /api/companion` | Builds a compact context (recent activity, goals, moods) and asks Claude for one insight; cache for 12h |
| `POST /api/notify` | Called after any activity insert; looks up the partner's push subscriptions and sends the web push |
| `GET /api/cron/daily` | Vercel Cron 06:00 SAST: unlockable capsules → push both partners; Monday → reset habits; anniversary in 7 days → gentle reminder |

Every mutation in the app does exactly what the prototype does: write the row,
write the `activity` row, fire `/api/notify`. Same event model, real delivery.

---

## 5. Live sync and notifications

- **Realtime**: subscribe to `activity` inserts for your `couple_id` via Supabase
  Realtime. When Konanani adds a memory while Mpho has the app open, his bell badge
  updates within a second — no refresh.
- **Web push**: on first login, ask notification permission, register the service
  worker, save the subscription to `push_subscriptions`. `/api/notify` sends via
  the `web-push` npm package (VAPID keys in env vars). Payload = title, body,
  deep-link route — exactly the banners in the notification preview.
- **iPhone caveat**: web push on iOS only works after "Add to Home Screen."
  Make that step part of Konanani's onboarding. The in-app bell works regardless.
- **Restraint rules** (from the product spec): love notes and capsule unlocks push
  immediately; memories/journal/goals push at most once per hour, batched
  ("Konanani added 3 things to your home"); moods and habit ticks never push —
  in-app feed only.

---

## 6. Pages (mirrors the prototype one-to-one)

```
/                     Home dashboard (greeting, mood, companion, love notes, rooms)
/invite               The invitation journey (no couple yet)
/invite/[token]       Konanani's receiving experience (public via token)
/timeline             Living timeline
/journal              Couple journal
/goals                Goals & habits
/capsules             Time capsules
/finance              Funds & contributions
/travel               Trip & packing list
/us                   Dates, invitation keepsake, settings
/alerts               Notification history
```

PWA: `manifest.json` (name SoulSync, burgundy theme #6D2E46, ivory background
#FAF7F3, 192/512 icons), service worker via `next-pwa`, offline shell for Home.

---

## 7. Build order (four weekends)

1. **Foundation** — scaffold Next.js + Tailwind + Supabase; auth; schema + RLS;
   couple pairing with the invite token flow. Milestone: both of you log in and
   share a couple_id.
2. **The rooms** — Home, Timeline, Journal, Goals, Finance, Travel, Us with real
   CRUD. Port the prototype's design system (colors, Cormorant + Inter, golden
   thread). Milestone: everything you do in the prototype works against Postgres.
3. **The heartbeat** — activity table, realtime bell, love notes, capsules,
   PWA install. Milestone: she adds a memory on her phone; your phone's bell
   lights up live.
4. **The magic** — web push, daily cron (capsule unlocks, habit reset), companion
   insight via Claude API, invitation receiving page polish. Milestone: a real
   push notification lands on a locked phone.

---

## 8. Running costs

Vercel hobby: R0. Supabase free tier: R0 (500MB DB, 1GB storage — years of
headroom for two people). Domain: ~R150–300/year. Claude API for the companion:
a few rand per month at one insight per person per day. Total: effectively the
domain.

---

## 9. Definition of done for Phase 1

Konanani opens a WhatsApp link, reads her sealed letter, accepts, installs the
app to her home screen — and from that day, everything either of you adds appears
on the other's phone, with a push notification for the moments that matter.
