alter table public.profiles
  add column if not exists bio text,
  add column if not exists blood_group text,
  add column if not exists gender text,
  add column if not exists present_address text,
  add column if not exists permanent_address text,
  add column if not exists working_place text,
  add column if not exists hobby text;
