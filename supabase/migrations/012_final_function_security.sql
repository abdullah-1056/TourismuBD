alter function public.is_super_admin() set schema private;
alter function public.list_public_provider_profiles() set schema private;
alter function public.list_public_reviews() set schema private;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
set search_path = public, private
as $$
  select private.is_super_admin();
$$;

create or replace view public.public_provider_profiles
with (security_barrier = true, security_invoker = true)
as select * from private.list_public_provider_profiles();

create or replace view public.public_reviews
with (security_barrier = true, security_invoker = true)
as select * from private.list_public_reviews();

grant usage on schema private to anon, authenticated;
revoke all on function private.is_super_admin() from public;
revoke all on function private.list_public_provider_profiles() from public;
revoke all on function private.list_public_reviews() from public;
grant execute on function private.is_super_admin() to anon, authenticated;
grant execute on function private.list_public_provider_profiles() to anon, authenticated;
grant execute on function private.list_public_reviews() to anon, authenticated;
grant execute on function public.is_super_admin() to anon, authenticated;

revoke execute on function public.protect_listing_status() from public, anon, authenticated;
revoke execute on function public.validate_service_provider_type() from public, anon, authenticated;
revoke execute on function public.booking_contacts(uuid) from public, anon, authenticated;
