-- Run in the Supabase SQL editor for task day boundary timezone.
-- Task day always resets at 4:00 AM in this IANA timezone.

alter table public.dashboard_settings
  add column if not exists task_day_timezone text default 'America/Chicago';
