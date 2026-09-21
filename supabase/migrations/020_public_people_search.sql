create or replace function private.list_public_people()
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
  permanent_address text
)
language sql
stable
security definer
set search_path = public
as $$
  select u.id, coalesce(nullif(p.display_name, ''), u.full_name), u.role,
         u.avatar_url, coalesce(p.bio, u.bio), u.email, u.phone,
         u.blood_group, u.gender, u.working_place, u.hobby,
         u.present_address, u.permanent_address
  from public.profiles u
  left join public.providers p on p.user_id = u.id
  where u.status = 'ACTIVE' and u.role <> 'SUPER_ADMIN';
$$;

create or replace view public.public_people
with (security_barrier = true, security_invoker = true)
as select * from private.list_public_people();

revoke all on function private.list_public_people() from public;
grant execute on function private.list_public_people() to anon, authenticated;
grant select on public.public_people to anon, authenticated;
