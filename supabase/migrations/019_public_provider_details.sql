create or replace function private.list_public_provider_details()
returns table (
  id uuid,
  type public.provider_type,
  display_name text,
  bio text,
  photo_url text,
  identity_verified boolean,
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
  select p.id, p.type, p.display_name, p.bio, p.photo_url, true,
         u.email, u.phone, u.blood_group, u.gender, u.working_place,
         u.hobby, u.present_address, u.permanent_address
  from public.providers p
  join public.profiles u on u.id = p.user_id
  where public.is_provider_discoverable(p.id);
$$;

create or replace view public.public_provider_details
with (security_barrier = true, security_invoker = true)
as select * from private.list_public_provider_details();

revoke all on function private.list_public_provider_details() from public;
grant execute on function private.list_public_provider_details() to anon, authenticated;
grant select on public.public_provider_details to anon, authenticated;
