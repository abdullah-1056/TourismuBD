alter table public.social_posts
  add column if not exists location_latitude numeric(9, 6),
  add column if not exists location_longitude numeric(9, 6),
  add column if not exists location_accuracy_meters integer;

alter table public.social_posts
  drop constraint if exists social_posts_location_valid,
  add constraint social_posts_location_valid check (
    (location_latitude is null and location_longitude is null and location_accuracy_meters is null)
    or (
      location_latitude between -90 and 90
      and location_longitude between -180 and 180
      and (location_accuracy_meters is null or location_accuracy_meters >= 0)
    )
  );
