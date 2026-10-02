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
