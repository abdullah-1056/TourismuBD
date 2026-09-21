alter table public.social_posts
  add column if not exists location_name text
  check (location_name is null or length(btrim(location_name)) between 1 and 120);
