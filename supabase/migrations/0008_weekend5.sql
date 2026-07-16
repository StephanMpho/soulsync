-- Weekend 5 — three small delighters: a zero-typing "thinking of you" ping
-- (reuses the existing push pipeline, no schema change needed for that one),
-- sealed love notes (the invite letter's envelope/wax-seal treatment,
-- reused for day-to-day notes), and lightweight emoji reactions on journal
-- entries and timeline events.

alter table love_notes add column opened_at timestamptz;

-- entry_id is deliberately not a foreign key: it points at either
-- journal_entries or timeline_events depending on entry_type, and Postgres
-- can't express a FK that targets one of two tables.
create table reactions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id),
  entry_type text not null check (entry_type in ('journal', 'timeline')),
  entry_id uuid not null,
  user_id uuid not null references profiles(id),
  emoji text not null,
  created_at timestamptz default now(),
  unique (entry_type, entry_id, user_id)
);

alter table reactions enable row level security;

create policy "couple members only" on reactions
  for all using (couple_id = public.my_couple_id());
