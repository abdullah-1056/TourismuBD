alter function public.owns_provider(uuid) set schema private;

create or replace function public.owns_provider(target_provider_id uuid)
returns boolean
language sql
stable
set search_path = public, private
as $$
  select private.owns_provider(target_provider_id);
$$;

grant usage on schema private to authenticated;
revoke all on function private.owns_provider(uuid) from public;
revoke all on function public.owns_provider(uuid) from public, anon;
grant execute on function private.owns_provider(uuid) to authenticated;
grant execute on function public.owns_provider(uuid) to authenticated;

revoke execute on function public.protect_profile_privileges() from public, anon, authenticated;
revoke execute on function public.protect_provider_admin_fields() from public, anon, authenticated;
revoke execute on function public.validate_subscription_provider_type() from public, anon, authenticated;
revoke execute on function public.validate_review() from public, anon, authenticated;
revoke execute on function public.validate_booking() from public, anon, authenticated;

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end;
$$;
