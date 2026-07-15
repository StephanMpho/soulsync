-- Row Level Security — the privacy guarantee (blueprint section 3).
-- One pattern covers most tables: a row is visible/writable only to members
-- of the couple it belongs to. Three tables need a variant of that pattern:
--   profiles     — also lets a user see/update their own row before pairing.
--   invitations  — couple members only; the token-based public read for the
--                  receiving partner goes through get_invitation_by_token()
--                  (a SECURITY DEFINER RPC below), never a table policy —
--                  a `using (true)` policy would leak every invitation's
--                  answers to any anonymous caller, not just the one token.
--   contributions — scoped through its parent fund, since it has no couple_id.
--
-- Every "couple members only" check below goes through my_couple_id()
-- rather than an inline `(select couple_id from profiles where id =
-- auth.uid())`. The inline form makes the *profiles* policy query
-- profiles from inside its own policy, which Postgres detects as
-- infinite recursion (42P17) and refuses to run — silently breaking every
-- read for every table, since they all resolve the caller's couple
-- through profiles. Wrapping the lookup in a SECURITY DEFINER function
-- bypasses RLS for that one internal lookup and breaks the cycle.
create function public.my_couple_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select couple_id from profiles where id = auth.uid();
$$;

grant execute on function public.my_couple_id() to authenticated;

alter table couples enable row level security;
alter table profiles enable row level security;
alter table invitations enable row level security;
alter table timeline_events enable row level security;
alter table journal_entries enable row level security;
alter table goals enable row level security;
alter table habits enable row level security;
alter table funds enable row level security;
alter table contributions enable row level security;
alter table capsules enable row level security;
alter table love_notes enable row level security;
alter table activity enable row level security;
alter table push_subscriptions enable row level security;

create policy "couple members only" on couples
  for select using (id = public.my_couple_id());

create policy "see your own or your partner's profile" on profiles
  for select using (
    id = auth.uid()
    or couple_id = public.my_couple_id()
  );
create policy "update your own profile" on profiles
  for update using (id = auth.uid());

create policy "couple members only" on invitations
  for select using (couple_id = public.my_couple_id());

create policy "couple members only" on timeline_events
  for all using (couple_id = public.my_couple_id());

create policy "couple members only" on journal_entries
  for all using (couple_id = public.my_couple_id());

create policy "couple members only" on goals
  for all using (couple_id = public.my_couple_id());

create policy "couple members only" on habits
  for all using (couple_id = public.my_couple_id());

create policy "couple members only" on funds
  for all using (couple_id = public.my_couple_id());

create policy "couple members only" on contributions
  for all using (
    fund_id in (select id from funds where couple_id = public.my_couple_id())
  );

-- Capsules: full row is readable by couple members; the still-sealed body
-- is masked at the query layer once the capsules feature is built
-- (weekend 3) — see blueprint section 3's note on returning body as null
-- until unlock_date.
create policy "couple members only" on capsules
  for all using (couple_id = public.my_couple_id());

create policy "couple members only" on love_notes
  for all using (couple_id = public.my_couple_id());

create policy "couple members only" on activity
  for all using (couple_id = public.my_couple_id());

create policy "own push subscriptions only" on push_subscriptions
  for all using (user_id = auth.uid());
