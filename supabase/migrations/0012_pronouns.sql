-- Lets each person set their own pronoun so the daily prompt can refer to
-- your partner correctly ("tell her" vs "tell him") instead of guessing.
alter table profiles add column pronoun text check (pronoun in ('he', 'she', 'they'));
