-- Completing the daily moment was a pure boolean with nothing to show your
-- partner what you actually did. Optional note, visible to your partner
-- once they check the Home page or get the notification.
alter table daily_completions add column note text;
