-- Bootstrap the one TourismuBD Super Admin as an Admin-only account.
-- This removes the selected account from public people/provider views while
-- preserving its existing Supabase Auth password.

do $$
declare
  promoted_user_id uuid;
begin
  update public.profiles
  set role = 'SUPER_ADMIN',
      status = 'ACTIVE',
      is_admin_only = true,
      updated_at = now()
  where lower(email) = 'mdabdullah200211@gmail.com'
  returning id into promoted_user_id;

  if promoted_user_id is null then
    raise exception 'The selected Super Admin email must already exist in Authentication: mdabdullah200211@gmail.com';
  end if;
end;
$$;

-- A TourismuBD installation has one active Super Admin at a time.
create unique index if not exists profiles_one_active_super_admin_idx
  on public.profiles (role)
  where role = 'SUPER_ADMIN' and status = 'ACTIVE';

-- Do not use PostgreSQL's current_role keyword as an alias here: it returns
-- the database role instead of the TourismuBD Admin role.
create or replace function public.current_admin_access()
returns table (role text, is_active boolean)
language sql
stable
security definer
set search_path = public, private
as $$
  select access.admin_role, true
  from (select private.current_admin_role() as admin_role) access
  where access.admin_role is not null;
$$;
