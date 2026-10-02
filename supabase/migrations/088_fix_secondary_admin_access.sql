-- PostgreSQL treats current_role as a built-in keyword. The earlier function
-- unintentionally returned the database role (for example, authenticated)
-- instead of the assigned TourismuBD Admin role.

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
