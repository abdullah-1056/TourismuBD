-- Backfill business contact data for accounts created before provider signup support.
update public.profiles p
set phone = nullif(u.raw_user_meta_data ->> 'phone', '')
from auth.users u
where p.id = u.id
  and (p.phone is null or p.phone = '')
  and nullif(u.raw_user_meta_data ->> 'phone', '') is not null;

with provider_profiles as (
  select
    p.id,
    p.full_name,
    p.email,
    p.phone,
    case p.role
      when 'TOUR_GUIDE' then 'GUIDE'::public.provider_type
      when 'HOUSEBOAT_OWNER' then 'HOUSEBOAT_OWNER'::public.provider_type
      when 'SMALL_BOAT_OWNER' then 'SMALL_BOAT_OWNER'::public.provider_type
      when 'RESORT_HOTEL_OWNER' then 'RESORT_HOTEL_OWNER'::public.provider_type
      when 'CAR_TRANSPORT_OWNER' then 'CAR_TRANSPORT_OWNER'::public.provider_type
      when 'PARKING_OWNER' then 'PARKING_OWNER'::public.provider_type
      when 'TOUR_AGENCY' then 'TOUR_AGENCY_ORGANIZATION'::public.provider_type
    end as provider_type
  from public.profiles p
  where p.role in ('TOUR_GUIDE', 'HOUSEBOAT_OWNER', 'SMALL_BOAT_OWNER', 'RESORT_HOTEL_OWNER', 'CAR_TRANSPORT_OWNER', 'PARKING_OWNER', 'TOUR_AGENCY')
    and p.phone is not null
    and p.phone <> ''
    and p.phone ~ '^(\\+880|0)1[3-9][0-9]{8}$'
)
insert into public.providers (user_id, type, display_name, contact_email, contact_phone)
select id, provider_type, full_name, email, phone
from provider_profiles
on conflict (user_id) do update
set display_name = excluded.display_name,
    contact_email = excluded.contact_email,
    contact_phone = excluded.contact_phone;
