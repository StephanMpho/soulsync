-- Voice-note love notes (mockup: soulsync-voice-note-mockup.jsx). A note is
-- now either text, audio, or both — body becomes optional and audio_path/
-- duration_seconds are added, with a check that at least one is present.

alter table love_notes alter column body drop not null;
alter table love_notes add column audio_path text;
alter table love_notes add column duration_seconds int;
alter table love_notes add constraint love_notes_has_content
  check (body is not null or audio_path is not null);

insert into storage.buckets (id, name, public)
values ('voice-notes', 'voice-notes', false)
on conflict (id) do nothing;

-- Objects are stored as `{couple_id}/{uuid}.<ext>` — folder-scoped access
-- via storage.foldername(), same couple-membership check used everywhere
-- else through my_couple_id().
create policy "couple members can read voice notes" on storage.objects
  for select using (
    bucket_id = 'voice-notes'
    and (storage.foldername(name))[1] = public.my_couple_id()::text
  );

create policy "couple members can upload voice notes" on storage.objects
  for insert with check (
    bucket_id = 'voice-notes'
    and (storage.foldername(name))[1] = public.my_couple_id()::text
  );
