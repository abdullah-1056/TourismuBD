-- A Super Admin can reserve a Secondary Admin role for any email address.
-- The role attaches to the account automatically when that email signs up.

alter table public.admin_accounts
  alter column user_id drop not null;

create or replace function public.assign_secondary_admin(
  admin_email text,
  admin_role text,
  active boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public, private
as $$
declare
  normalized_email text := lower(trim(admin_email));
  target_user_id uuid;
  target_role public.app_role;
  account_id uuid;
begin
  perform private.require_super_admin_management();

  if normalized_email is null or normalized_email = '' then
    raise exception 'Enter an email address';
  end if;

  if admin_role not in ('users_admin', 'business_admin', 'provider_admin', 'subscription_admin', 'booking_admin') then
    raise exception 'Choose a valid Secondary Admin role';
  end if;

  select id, role into target_user_id, target_role
  from public.profiles
  where lower(email) = normalized_email
  limit 1;

  if found and target_role = 'SUPER_ADMIN' then
    raise exception 'A Super Admin cannot be managed as a Secondary Admin';
  end if;

  select id into account_id
  from public.admin_accounts
  where lower(email) = normalized_email
     or (target_user_id is not null and user_id = target_user_id)
  limit 1
  for update;

  if found then
    update public.admin_accounts
    set user_id = target_user_id,
        email = normalized_email,
        role = admin_role,
        is_active = active,
        updated_at = now()
    where id = account_id;
  else
    insert into public.admin_accounts (user_id, email, role, is_active)
    values (target_user_id, normalized_email, admin_role, active)
    returning id into account_id;
  end if;

  return account_id;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := upper(coalesce(new.raw_user_meta_data ->> 'role', 'TRAVELER'));
  assigned_role public.app_role := 'TRAVELER';
  assigned_provider_type public.provider_type;
  signup_phone text := nullif(new.raw_user_meta_data ->> 'phone', '');
  normalized_signup_phone text;
begin
  if signup_phone is null or signup_phone !~ '^(\+880|0)1[3-9][0-9]{8}$' then
    raise exception 'A valid Bangladesh phone number is required for every account';
  end if;
  normalized_signup_phone := case when signup_phone like '+880%' then '0' || substring(signup_phone from 5) else signup_phone end;

  if exists (
    select 1
    from public.profiles blocked_profile
    where blocked_profile.status = 'SUSPENDED'
      and (
        (new.email is not null and lower(blocked_profile.email) = lower(new.email))
        or case when blocked_profile.phone like '+880%' then '0' || substring(blocked_profile.phone from 5) else blocked_profile.phone end = normalized_signup_phone
      )
  ) then
    raise exception 'This account cannot be created with the supplied contact details';
  end if;

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

  insert into public.profiles (id, role, full_name, email, phone)
  values (new.id, assigned_role, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.email, signup_phone)
  on conflict (id) do nothing;

  -- Claim any pre-approved Secondary Admin invitation for this email.
  if new.email is not null then
    update public.admin_accounts
    set user_id = new.id,
        email = lower(new.email),
        updated_at = now()
    where user_id is null
      and lower(email) = lower(new.email);
  end if;

  if assigned_provider_type is not null then
    insert into public.providers (user_id, type, display_name, contact_email, contact_phone)
    values (new.id, assigned_provider_type, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.email, signup_phone)
    on conflict (user_id) do nothing;
  elsif assigned_role = 'BUSINESS_OWNER' then
    insert into public.businesses (user_id, business_name, district, contact_email, contact_phone)
    values (
      new.id,
      coalesce(nullif(new.raw_user_meta_data ->> 'business_name', ''), nullif(new.raw_user_meta_data ->> 'full_name', ''), 'Business'),
      nullif(new.raw_user_meta_data ->> 'district', ''),
      new.email,
      signup_phone
    )
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.assign_secondary_admin(text, text, boolean) from public, anon;
grant execute on function public.assign_secondary_admin(text, text, boolean) to authenticated;
