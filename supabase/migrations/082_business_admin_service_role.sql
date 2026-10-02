create or replace function public.protect_business_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- The local Admin proxy uses Supabase's service-role credential, which has no user id.
  if auth.uid() is null or public.is_super_admin() then
    return new;
  end if;
  if new.user_id is distinct from old.user_id
     or new.account_status is distinct from old.account_status
     or new.public_status is distinct from old.public_status then
    raise exception 'Business approval fields are Admin-controlled';
  end if;
  return new;
end;
$$;

revoke execute on function public.protect_business_admin_fields() from public, anon, authenticated;
