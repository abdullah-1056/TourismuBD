alter table public.profiles
  add column if not exists district text;

drop view if exists public.public_people;
drop function if exists private.list_public_people_with_followers();

create function private.list_public_people_with_followers()
returns table (
  id uuid, full_name text, role public.app_role, avatar_url text, bio text, district text,
  email text, phone text, blood_group text, gender text, working_place text, hobby text,
  present_address text, permanent_address text, follower_count integer, followers_visible boolean,
  profile_photo_urls text[]
)
language sql stable security definer set search_path = public as $$
  select u.id, coalesce(nullif(p.display_name, ''), u.full_name), u.role, u.avatar_url,
         coalesce(p.bio, u.bio), u.district, u.email, u.phone, u.blood_group, u.gender,
         u.working_place, u.hobby, u.present_address, u.permanent_address,
         count(f.follower_id)::integer, u.followers_visible, u.profile_photo_urls
  from public.profiles u
  left join public.providers p on p.user_id = u.id
  left join public.profile_follows f on f.following_id = u.id
  where u.status = 'ACTIVE' and u.role <> 'SUPER_ADMIN'
  group by u.id, p.display_name, p.bio;
$$;

create view public.public_people with (security_barrier = true, security_invoker = true)
as select * from private.list_public_people_with_followers();
grant usage on schema private to anon, authenticated;
revoke all on function private.list_public_people_with_followers() from public;
grant execute on function private.list_public_people_with_followers() to anon, authenticated;
grant select on public.public_people to anon, authenticated;

drop view if exists public.public_provider_details;
drop function if exists private.list_public_provider_details();

create function private.list_public_provider_details()
returns table (
  id uuid, type public.provider_type, display_name text, bio text, photo_url text,
  identity_verified boolean, district text, email text, phone text, blood_group text,
  gender text, working_place text, hobby text, present_address text, permanent_address text
)
language sql stable security definer set search_path = public as $$
  select p.id, p.type, p.display_name, p.bio, p.photo_url, true, u.district, u.email,
         u.phone, u.blood_group, u.gender, u.working_place, u.hobby,
         u.present_address, u.permanent_address
  from public.providers p
  join public.profiles u on u.id = p.user_id
  where public.is_provider_discoverable(p.id);
$$;

create view public.public_provider_details with (security_barrier = true, security_invoker = true)
as select * from private.list_public_provider_details();
revoke all on function private.list_public_provider_details() from public;
grant execute on function private.list_public_provider_details() to anon, authenticated;
grant select on public.public_provider_details to anon, authenticated;
