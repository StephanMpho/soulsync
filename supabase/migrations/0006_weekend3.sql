-- Weekend 3 — the heartbeat: activity feed + realtime bell, capsules.

-- Realtime broadcasts are gated by RLS but must also be explicitly enabled
-- per table via the supabase_realtime publication, or no change events ever
-- reach subscribed clients no matter how the policies are set up.
alter publication supabase_realtime add table activity;

-- Bulk "mark everything I haven't seen yet as seen," called when the
-- alerts page is opened. One round trip instead of one UPDATE per row.
create function public.mark_activity_seen()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_couple_id uuid := public.my_couple_id();
begin
  if v_user_id is null or v_couple_id is null then
    return;
  end if;

  update activity
  set seen_by = array_append(seen_by, v_user_id)
  where couple_id = v_couple_id
    and not (v_user_id = any(seen_by));
end;
$$;

grant execute on function public.mark_activity_seen() to authenticated;

-- Capsules: migration 0002 already restricts the base table to couple
-- members, but that alone lets either partner read a still-sealed body
-- straight from the table. This view nulls the body out until unlock_date,
-- enforced in the database rather than just hidden in the UI.
-- security_invoker keeps the view subject to the querying user's own RLS
-- (the couples-only policy on the base table) instead of the view owner's.
create view capsules_view
with (security_invoker = true)
as
select
  id,
  couple_id,
  author_id,
  title,
  case when unlock_date <= current_date then body else null end as body,
  unlock_date,
  opened_at
from capsules;

grant select on capsules_view to authenticated;
