-- Real photos on timeline events and journal entries — the gap-audit's
-- "does this feel real or like a demo" item. One photo per entry, no
-- editing/filters, matching the recommended minimal scope.

alter table timeline_events add column photo_path text;
alter table journal_entries add column photo_path text;

insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

-- Same folder-scoped pattern as the voice-notes bucket: objects are stored
-- as `{couple_id}/{uuid}.jpg`, access checked via storage.foldername()
-- against my_couple_id().
create policy "couple members can read photos" on storage.objects
  for select using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = public.my_couple_id()::text
  );

create policy "couple members can upload photos" on storage.objects
  for insert with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = public.my_couple_id()::text
  );
