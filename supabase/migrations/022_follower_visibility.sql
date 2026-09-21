alter table public.profiles
  add column if not exists followers_visible boolean not null default true;

drop view if exists public.public_people;
drop function if exists private.list_public_people_with_followers();

create function private.list_public_people_with_followers()
returns table (
  id uuid,
  full_name text,
  role public.app_role,
  avatar_url text,
  bio text,
  email text,
  phone text,
  blood_group text,
  gender text,
  working_place text,
  hobby text,
  present_address text,
  permanent_address text,
  follower_count integer,
  followers_visible boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select u.id, coalesce(nullif(p.display_name, ''), u.full_name), u.role,
         u.avatar_url, coalesce(p.bio, u.bio), u.email, u.phone,
         u.blood_group, u.gender, u.working_place, u.hobby,
         u.present_address, u.permanent_address, count(f.follower_id)::integer,
         u.followers_visible
  from public.profiles u
  left join public.providers p on p.user_id = u.id
  left join public.profile_follows f on f.following_id = u.id
  where u.status = 'ACTIVE' and u.role <> 'SUPER_ADMIN'
  group by u.id, p.display_name, p.bio;
$$;

create or replace view public.public_people
with (security_barrier = true, security_invoker = true)
as select * from private.list_public_people_with_followers();

grant usage on schema private to anon, authenticated;
revoke all on function private.list_public_people_with_followers() from public;
grant execute on function private.list_public_people_with_followers() to anon, authenticated;
grant select on public.public_people to anon, authenticated;
