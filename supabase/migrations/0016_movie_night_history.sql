-- Tracks whether a finished movie night has already been logged to the
-- Timeline, so "Past movie nights" can show "Added ✓" instead of letting
-- it be logged twice. Ended movie nights are no longer deleted on
-- dismiss — they stay as permanent history.
alter table movie_nights add column logged_at timestamptz;
