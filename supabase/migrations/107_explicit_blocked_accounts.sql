-- Add is_blocked flag so accounts in Activate accounts transition cleanly to
-- Blocked accounts only when explicitly blocked by an Admin.
alter table public.profiles
  add column if not exists is_blocked boolean not null default false;

alter table public.providers
  add column if not exists is_blocked boolean not null default false;

alter table public.businesses
  add column if not exists is_blocked boolean not null default false;
