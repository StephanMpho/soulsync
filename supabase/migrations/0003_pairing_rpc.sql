-- Couple pairing — implemented as SECURITY DEFINER functions rather than a
-- service-role API route, so each multi-table write (create couple + attach
-- inviter + insert invitation, or attach partner + accept + seed timeline)
-- runs as one real Postgres transaction instead of sequential REST calls.
-- Both are called with the caller's own auth.uid(), so a signed-in user can
-- only ever pair *themselves* — no client-supplied user id is trusted.

create function public.create_invitation(p_answers jsonb)
returns text
language plpgsql
security definer
set search_path = public, extensions -- gen_random_bytes lives in Supabase's `extensions` schema
as $$
declare
  v_user_id uuid := auth.uid();
  v_couple_id uuid;
  v_token text;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if exists (select 1 from profiles where id = v_user_id and couple_id is not null) then
    raise exception 'You already belong to a couple';
  end if;

  insert into couples default values returning id into v_couple_id;

  update profiles set couple_id = v_couple_id where id = v_user_id;

  v_token := encode(gen_random_bytes(16), 'hex');

  insert into invitations (couple_id, inviter_id, token, answers)
  values (v_couple_id, v_user_id, v_token, p_answers);

  return v_token;
end;
$$;

grant execute on function public.create_invitation(jsonb) to authenticated;

create function public.get_invitation_by_token(p_token text)
returns table (
  couple_id uuid,
  answers jsonb,
  status text,
  inviter_name text
)
language sql
security definer
set search_path = public
as $$
  select i.couple_id, i.answers, i.status, p.display_name
  from invitations i
  join profiles p on p.id = i.inviter_id
  where i.token = p_token;
$$;

grant execute on function public.get_invitation_by_token(text) to anon, authenticated;

create function public.accept_invitation(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_invite invitations%rowtype;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if exists (select 1 from profiles where id = v_user_id and couple_id is not null) then
    raise exception 'You already belong to a couple';
  end if;

  select * into v_invite from invitations where token = p_token and status = 'sent' for update;
  if not found then
    raise exception 'Invitation not found or already accepted';
  end if;

  update profiles set couple_id = v_invite.couple_id where id = v_user_id;

  update invitations set status = 'accepted' where id = v_invite.id;

  insert into timeline_events (couple_id, author_id, title, note, kind, is_past, event_date)
  values (
    v_invite.couple_id,
    v_invite.inviter_id,
    'The invitation',
    v_invite.answers ->> 0,
    'milestone',
    true,
    current_date
  );
end;
$$;

grant execute on function public.accept_invitation(text) to authenticated;
