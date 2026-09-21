-- Keep the existing UUID keys for relational integrity; district_code is the stable public/admin identifier.
alter table public.districts
  add column district_code text,
  add column display_order integer not null default 0 check (display_order >= 0),
  add column is_published boolean generated always as (status = 'PUBLISHED') stored;

update public.districts
set district_code = slug
where district_code is null;

alter table public.districts
  alter column district_code set not null,
  add constraint districts_district_code_key unique (district_code);

alter table public.places
  add column image_url text,
  add column is_published boolean generated always as (status = 'PUBLISHED') stored;

-- Existing policies already expose only PUBLISHED rows and give mutations only to is_super_admin().
alter table public.districts enable row level security;
alter table public.places enable row level security;
