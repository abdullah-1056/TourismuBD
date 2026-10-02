-- Bootstrap one private Super Admin without requiring a public TourismuBD account.
-- The invitation whitelist is private and can be prepared only by the service role.

create table if not exists private.super_admin_invitations (
  email text primary key,
  created_at timestamptz not null default now(),
  consumed_at timestamptz
);

create unique index if not exists profiles_one_active_super_admin_idx
  on public.profiles (role)
  where role = 'SUPER_ADMIN' and status = 'ACTIVE';

create or replace function public.prepare_super_admin_invitation(admin_email text)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
declare
  normalized_email text := lower(trim(admin_email));
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'Only the server may prepare a Super Admin invitation' using errcode = '42501';
  end if;
  if normalized_email is null or normalized_email !~ '^\S+@\S+\.\S+$' then
    raise exception 'Enter a valid Super Admin email';
  end if;
  if exists (
    select 1 from public.profiles
    where role = 'SUPER_ADMIN' and status = 'ACTIVE'
      and lower(email) <> normalized_email
  ) then
    raise exception 'A different active Super Admin already exists';
  end if;

  insert into private.super_admin_invitations (email, consumed_at)
  values (normalized_email, null)
  on conflict (email) do update set consumed_at = null, created_at = now();
end;
$$;

create or replace function public.activate_super_admin_identity(admin_email text)
returns uuid
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  normalized_email text := lower(trim(admin_email));
  target_user_id uuid;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'Only the server may activate a Super Admin identity' using errcode = '42501';
  end if;
  if not exists (select 1 from private.super_admin_invitations where email = normalized_email) then
    raise exception 'No prepared Super Admin invitation exists for this email';
  end if;

  select id into target_user_id from auth.users where lower(email) = normalized_email limit 1;
  if target_user_id is null then
    raise exception 'Create the private Auth invitation before activating this Super Admin';
  end if;

  insert into public.profiles (id, role, full_name, email, status, is_admin_only)
  values (target_user_id, 'SUPER_ADMIN', 'Super Admin', normalized_email, 'ACTIVE', true)
  on conflict (id) do update
    set role = 'SUPER_ADMIN', status = 'ACTIVE', is_admin_only = true, email = excluded.email, updated_at = now();

  update private.super_admin_invitations set consumed_at = now() where email = normalized_email;
  return target_user_id;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  requested_role text := upper(coalesce(new.raw_user_meta_data ->> 'role', 'TRAVELER'));
  assigned_role public.app_role := 'TRAVELER';
  assigned_provider_type public.provider_type;
  signup_phone text := nullif(new.raw_user_meta_data ->> 'phone', '');
  normalized_signup_phone text;
  is_super_admin_invitation boolean := new.email is not null and exists (
    select 1 from private.super_admin_invitations where email = lower(new.email) and consumed_at is null
  );
  is_secondary_admin_invitation boolean := new.email is not null and exists (
    select 1 from public.admin_accounts where user_id is null and lower(email) = lower(new.email)
  );
  is_admin_invitation boolean;
begin
  is_admin_invitation := is_super_admin_invitation or is_secondary_admin_invitation;
  if not is_admin_invitation and (signup_phone is null or signup_phone !~ '^(\+880|0)1[3-9][0-9]{8}$') then
    raise exception 'A valid Bangladesh phone number is required for every account';
  end if;
  normalized_signup_phone := case when signup_phone like '+880%' then '0' || substring(signup_phone from 5) else signup_phone end;

  if exists (
    select 1 from public.profiles blocked_profile
    where blocked_profile.status = 'SUSPENDED'
      and ((new.email is not null and lower(blocked_profile.email) = lower(new.email))
        or (normalized_signup_phone is not null and case when blocked_profile.phone like '+880%' then '0' || substring(blocked_profile.phone from 5) else blocked_profile.phone end = normalized_signup_phone))
  ) then
    raise exception 'This account cannot be created with the supplied contact details';
  end if;

  if is_super_admin_invitation then
    assigned_role := 'SUPER_ADMIN';
  elsif not is_admin_invitation then
    case requested_role
      when 'TOUR_GUIDE' then assigned_role := 'TOUR_GUIDE'; assigned_provider_type := 'GUIDE';
      when 'HOUSEBOAT_OWNER' then assigned_role := 'HOUSEBOAT_OWNER'; assigned_provider_type := 'HOUSEBOAT_OWNER';
      when 'SMALL_BOAT_OWNER' then assigned_role := 'SMALL_BOAT_OWNER'; assigned_provider_type := 'SMALL_BOAT_OWNER';
      when 'RESORT_HOTEL_OWNER' then assigned_role := 'RESORT_HOTEL_OWNER'; assigned_provider_type := 'RESORT_HOTEL_OWNER';
      when 'CAR_TRANSPORT_OWNER' then assigned_role := 'CAR_TRANSPORT_OWNER'; assigned_provider_type := 'CAR_TRANSPORT_OWNER';
      when 'PARKING_OWNER' then assigned_role := 'PARKING_OWNER'; assigned_provider_type := 'PARKING_OWNER';
      when 'TOUR_AGENCY' then assigned_role := 'TOUR_AGENCY'; assigned_provider_type := 'TOUR_AGENCY_ORGANIZATION';
      when 'BUSINESS_OWNER' then assigned_role := 'BUSINESS_OWNER'; assigned_provider_type := null;
      else assigned_role := 'TRAVELER'; assigned_provider_type := null;
    end case;
  end if;

  insert into public.profiles (id, role, full_name, email, phone, is_admin_only)
  values (new.id, assigned_role, case when is_admin_invitation then 'Admin' else coalesce(new.raw_user_meta_data ->> 'full_name', '') end, new.email, signup_phone, is_admin_invitation)
  on conflict (id) do nothing;

  if is_super_admin_invitation then
    update private.super_admin_invitations set consumed_at = now() where email = lower(new.email);
  end if;
  if new.email is not null then
    update public.admin_accounts set user_id = new.id, email = lower(new.email), updated_at = now()
    where user_id is null and lower(email) = lower(new.email);
  end if;
  if assigned_provider_type is not null then
    insert into public.providers (user_id, type, display_name, contact_email, contact_phone)
    values (new.id, assigned_provider_type, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.email, signup_phone)
    on conflict (user_id) do nothing;
  elsif assigned_role = 'BUSINESS_OWNER' then
    insert into public.businesses (user_id, business_name, district, contact_email, contact_phone)
    values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'business_name', ''), nullif(new.raw_user_meta_data ->> 'full_name', ''), 'Business'), nullif(new.raw_user_meta_data ->> 'district', ''), new.email, signup_phone)
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

revoke all on table private.super_admin_invitations from public, anon, authenticated;
revoke execute on function public.prepare_super_admin_invitation(text) from public, anon, authenticated;
revoke execute on function public.activate_super_admin_identity(text) from public, anon, authenticated;
grant execute on function public.prepare_super_admin_invitation(text) to service_role;
grant execute on function public.activate_super_admin_identity(text) to service_role;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
