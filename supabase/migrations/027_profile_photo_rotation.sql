alter table public.profiles
  add column if not exists profile_photo_urls text[] not null default '{}';

update public.profiles
set profile_photo_urls = array[avatar_url]
where avatar_url is not null
  and cardinality(profile_photo_urls) = 0;
