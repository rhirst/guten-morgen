-- Run in the Supabase SQL editor to persist theme customizer selections.
-- null = app defaults; JSON object = saved presets / radius / import / brand colors / layout.

alter table public.dashboard_settings
  add column if not exists theme_customization jsonb default null;
