-- Daily shared prompt + streak/garden — the gap-audit's "don't break the
-- chain" mechanic. One row per person per day; a day only counts toward
-- the streak/garden once both partners have completed it.

create table daily_completions (
  couple_id uuid not null references couples(id),
  date date not null,
  user_id uuid not null references profiles(id),
  completed_at timestamptz not null default now(),
  primary key (couple_id, date, user_id)
);

alter table daily_completions enable row level security;

create policy "couple members only" on daily_completions
  for all using (couple_id = public.my_couple_id());
