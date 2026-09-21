alter function public.fill_district_code() set search_path = public;

create schema if not exists private;
alter function public.is_provider_discoverable(uuid) set schema private;

create or replace function public.is_provider_discoverable(target_provider_id uuid)
returns boolean
language sql
stable
set search_path = public, private
as $$
  select private.is_provider_discoverable(target_provider_id);
$$;

grant usage on schema private to anon, authenticated;
revoke all on function private.is_provider_discoverable(uuid) from public;
grant execute on function private.is_provider_discoverable(uuid) to anon, authenticated;
grant execute on function public.is_provider_discoverable(uuid) to anon, authenticated;

revoke execute on function public.audit_super_admin_change() from public, anon, authenticated;
revoke execute on function public.create_provider_subscription() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.booking_contacts(uuid) from public, anon;
grant execute on function public.booking_contacts(uuid) to authenticated;
