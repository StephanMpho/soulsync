-- SoulSync Phase 1 schema — matches soulsync-phase1-blueprint.md section 3 verbatim.
create extension if not exists pgcrypto;

create table couples (
  id uuid primary key default gen_random_uuid(),
  met_date date,
  anniversary date,
  created_at timestamptz default now()
);

create table profiles (              -- 1:1 with auth.users
  id uuid primary key references auth.users(id) on delete cascade,
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

-- Auto-create a profile row the moment someone signs up, using the
-- display_name passed in auth signUp(options.data). Keeps every other
-- table's `references profiles(id)` valid from the first request onward.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
