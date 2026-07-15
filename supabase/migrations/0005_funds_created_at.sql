-- The blueprint's funds table (migration 0001) never got a created_at
-- column, but the Finance page orders by it — silently failing the whole
-- select (PostgREST errors on ordering by a nonexistent column) and making
-- every fund invisible even though the rows exist.
alter table funds add column created_at timestamptz not null default now();
