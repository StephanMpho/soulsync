-- Weekend 2 additions: the rooms need a couples UPDATE policy (met_date /
-- anniversary editing on the Us page — migration 0002 only ever granted
-- SELECT on couples), a packing list table for the Travel room (the
-- blueprint's page list names "Trip & packing list" but section 3's schema
-- never defined a table for it — this fills that gap, shaped just like
-- `habits` since it's the same "named checklist item" concept), and an
-- atomic contribute-to-fund RPC so a contribution row and the fund's
-- running total never drift apart.

create policy "couple members can update" on couples
  for update using (id = public.my_couple_id());

create table packing_items (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id),
  name text not null,
  done boolean default false,
  created_at timestamptz default now()
);

alter table packing_items enable row level security;

create policy "couple members only" on packing_items
  for all using (couple_id = public.my_couple_id());

create function public.contribute_to_fund(p_fund_id uuid, p_amount_cents bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_couple_id uuid := public.my_couple_id();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (select 1 from funds where id = p_fund_id and couple_id = v_couple_id) then
    raise exception 'Fund not found';
  end if;

  insert into contributions (fund_id, user_id, amount_cents)
  values (p_fund_id, v_user_id, p_amount_cents);

  update funds set saved_cents = saved_cents + p_amount_cents where id = p_fund_id;
end;
$$;

grant execute on function public.contribute_to_fund(uuid, bigint) to authenticated;

-- Clamped, race-free increment/decrement for the Goals steppers — a plain
-- REST update can't express "pct + delta" against the current row value
-- without a read-then-write round trip.
create function public.bump_goal_pct(p_goal_id uuid, p_delta int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_couple_id uuid := public.my_couple_id();
begin
  if v_couple_id is null then
    raise exception 'Not authenticated';
  end if;

  update goals
  set pct = greatest(0, least(100, pct + p_delta))
  where id = p_goal_id and couple_id = v_couple_id;
end;
$$;

grant execute on function public.bump_goal_pct(uuid, int) to authenticated;
