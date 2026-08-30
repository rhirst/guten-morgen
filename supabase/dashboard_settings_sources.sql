-- Run in the Supabase SQL editor to support calendar / task list visibility.
-- null = show all sources; JSON array of Google IDs = allowlist.

alter table public.dashboard_settings
  add column if not exists enabled_calendar_ids jsonb default null,
  add column if not exists enabled_task_list_ids jsonb default null;
