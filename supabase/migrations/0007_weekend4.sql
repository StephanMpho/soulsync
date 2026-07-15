-- Weekend 4 — the magic: companion insight cache, push notification plumbing.

create table companion_insights (
  couple_id uuid primary key references couples(id),
  insight text not null,
  generated_at timestamptz not null default now()
);

alter table companion_insights enable row level security;

create policy "couple members only" on companion_insights
  for all using (couple_id = public.my_couple_id());

-- Re-subscribing (same browser re-granting permission, or the service
-- worker rotating a subscription) should update the existing row, not pile
-- up duplicates — needed for the upsert(onConflict: "endpoint") in the
-- subscribe action.
alter table push_subscriptions add constraint push_subscriptions_endpoint_key unique (endpoint);

-- push_subscriptions (migration 0001/0002) only ever let you see your own
-- row. Notifying your partner requires looking up *their* subscription
-- endpoint, so reads open up to the couple; writes stay self-only.
drop policy "own push subscriptions only" on push_subscriptions;

create policy "couple members can read" on push_subscriptions
  for select using (
    user_id in (select id from profiles where couple_id = public.my_couple_id())
  );

create policy "manage your own subscription" on push_subscriptions
  for insert with check (user_id = auth.uid());

create policy "update your own subscription" on push_subscriptions
  for update using (user_id = auth.uid());

create policy "delete your own subscription" on push_subscriptions
  for delete using (user_id = auth.uid());

-- Batching state for the restraint rule: memory/journal/goal notifications
-- push at most once per hour, per couple. One row per couple+category —
-- the first notification in a fresh window sends immediately; later ones
-- in the same window just increment the count silently.
create table notification_windows (
  couple_id uuid not null references couples(id),
  category text not null,
  window_started_at timestamptz not null default now(),
  count int not null default 0,
  primary key (couple_id, category)
);

alter table notification_windows enable row level security;

create policy "couple members only" on notification_windows
  for all using (couple_id = public.my_couple_id());

create function public.should_notify_batched(p_category text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_couple_id uuid := public.my_couple_id();
  v_window notification_windows%rowtype;
begin
  if v_couple_id is null then
    return false;
  end if;

  select * into v_window from notification_windows
  where couple_id = v_couple_id and category = p_category
  for update;

  if not found then
    insert into notification_windows (couple_id, category, window_started_at, count)
    values (v_couple_id, p_category, now(), 1);
    return true;
  end if;

  if v_window.window_started_at < now() - interval '1 hour' then
    update notification_windows
    set window_started_at = now(), count = 1
    where couple_id = v_couple_id and category = p_category;
    return true;
  end if;

  update notification_windows
  set count = count + 1
  where couple_id = v_couple_id and category = p_category;
  return false;
end;
$$;

grant execute on function public.should_notify_batched(text) to authenticated;
