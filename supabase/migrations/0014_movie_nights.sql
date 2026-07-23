-- Movie Night (soulsync-movie-night-mockup.jsx) — SoulSync never plays the
-- film itself (DRM makes that impossible for real streaming services);
-- this just keeps a scheduled time, a synchronized countdown ritual, an
-- elapsed-time overlay, and live reactions while each partner watches on
-- their own streaming account.

create table movie_nights (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id),
  title text not null,
  service text not null default 'Other',
  scheduled_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'live', 'ended')),
  started_at timestamptz,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

alter table movie_nights enable row level security;

create policy "couple members only" on movie_nights
  for all using (couple_id = public.my_couple_id());

-- Both screens need to see status changes (scheduled -> live -> ended)
-- the instant either partner triggers them, same as the activity table.
alter publication supabase_realtime add table movie_nights;
