-- Run in the Supabase SQL editor to support the dashboard photo slideshow.
-- null = no album configured; text = full iCloud shared album URL.

alter table public.dashboard_settings
  add column if not exists icloud_shared_album_url text default null;
