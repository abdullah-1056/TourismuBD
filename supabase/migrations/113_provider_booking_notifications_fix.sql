-- Fix: Ensure guide bookings work cleanly and providers receive instant notifications
-- 1. Ensure notification kinds permit BOOKING_REQUESTED and DIRECT_MESSAGE
alter table public.notifications
  drop constraint if exists notifications_kind_check;

alter table public.notifications
  add constraint notifications_kind_check
  check (kind in ('BOOKING_REQUESTED', 'BOOKING_CONFIRMED', 'BOOKING_COMPLETED', 'BOOKING_CANCELLED', 'DIRECT_MESSAGE'));

-- 2. Ensure validate_booking does not require obsolete guide_profiles table
create or replace function public.validate_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actual_provider_type public.provider_type;
  listing_provider_id uuid;
  listing_water_body_id uuid;
  listing_status public.record_status;
  sundarbans boolean := false;
  admin_user boolean := auth.uid() is null or public.is_super_admin() or public.can_access_admin_module('bookings');
  provider_owner boolean;
begin
  select type into actual_provider_type from public.providers where id = new.provider_id;
  if not found then
    raise exception 'Unknown provider';
  end if;

  if actual_provider_type <> (case new.service_type
    when 'GUIDE' then 'GUIDE'::public.provider_type
    when 'HOUSEBOAT' then 'HOUSEBOAT_OWNER'::public.provider_type
    when 'SMALL_BOAT' then 'SMALL_BOAT_OWNER'::public.provider_type
    when 'RESORT_HOTEL' then 'RESORT_HOTEL_OWNER'::public.provider_type
    when 'CAR_TRANSPORT' then 'CAR_TRANSPORT_OWNER'::public.provider_type
    when 'PARKING' then 'PARKING_OWNER'::public.provider_type
    when 'TOUR_AGENCY' then 'TOUR_AGENCY_ORGANIZATION'::public.provider_type
  end) then
    raise exception 'Booking service does not match provider type';
  end if;

  if new.service_type = 'GUIDE' then
    new.water_body_id = null;
  elsif new.service_type = 'HOUSEBOAT' then
    select provider_id, water_body_id, status
      into listing_provider_id, listing_water_body_id, listing_status
    from public.houseboat_listings where id = new.houseboat_listing_id;
    if listing_provider_id is distinct from new.provider_id or listing_status <> 'PUBLISHED' then
      raise exception 'Houseboat listing is not bookable';
    end if;
    new.water_body_id = listing_water_body_id;
  elsif new.service_type = 'SMALL_BOAT' then
    select l.provider_id, l.water_body_id, l.status, w.is_sundarbans
      into listing_provider_id, listing_water_body_id, listing_status, sundarbans
    from public.small_boat_listings l
    join public.water_bodies w on w.id = l.water_body_id
    where l.id = new.small_boat_listing_id;
    if listing_provider_id is distinct from new.provider_id or listing_status <> 'PUBLISHED' then
      raise exception 'Small boat listing is not bookable';
    end if;
    new.water_body_id = listing_water_body_id;
    if sundarbans and new.duration_days <> 1 then
      raise exception 'Sundarbans small boat bookings must be exactly 1 day';
    end if;
  else
    new.water_body_id = null;
  end if;

  if tg_op = 'INSERT' then
    if new.status <> 'PENDING' then
      raise exception 'New bookings must be Pending';
    end if;
    if not admin_user and new.traveler_id <> auth.uid() then
      raise exception 'Traveler may only create their own booking';
    end if;
  else
    if row(new.traveler_id, new.provider_id, new.service_type,
           new.houseboat_listing_id, new.small_boat_listing_id,
           new.saved_trip_id, new.primary_place_id, new.start_date,
           new.duration_days, new.traveler_count, new.preferred_language, new.note)
       is distinct from
       row(old.traveler_id, old.provider_id, old.service_type,
           old.houseboat_listing_id, old.small_boat_listing_id,
           old.saved_trip_id, old.primary_place_id, old.start_date,
           old.duration_days, old.traveler_count, old.preferred_language, old.note) then
      raise exception 'Booking parties and terms are immutable';
    end if;

    if not admin_user then
      provider_owner = public.owns_provider(old.provider_id);
      if provider_owner then
        if new.traveler_contact_consent is distinct from old.traveler_contact_consent then
          raise exception 'Only the traveler may change contact consent';
        end if;
        if not ((old.status = 'PENDING' and new.status in ('CONFIRMED', 'CANCELLED'))
                or (old.status = 'CONFIRMED' and new.status in ('COMPLETED', 'CANCELLED'))) then
          raise exception 'Invalid provider booking transition';
        end if;
      elsif old.traveler_id = auth.uid() then
        if new.status = old.status and new.traveler_contact_consent is distinct from old.traveler_contact_consent then
          null;
        elsif (old.status = 'CONFIRMED' and new.status = 'COMPLETED')
           or (new.status = 'CANCELLED' and old.status in ('PENDING', 'CONFIRMED')) then
          null;
        else
          raise exception 'Traveler may only cancel an active booking or complete a confirmed booking';
        end if;
      else
        raise exception 'Not a booking party';
      end if;
    end if;
  end if;

  if tg_op = 'INSERT' or (old.status = 'PENDING' and new.status = 'CONFIRMED') then
    if not public.is_provider_discoverable(new.provider_id) then
      raise exception 'Provider account must be active and publicly listed';
    end if;
  end if;

  return new;
end;
$$;

-- 3. Populate guide_profiles for any existing guides as a safety fallback
insert into public.guide_profiles (provider_id)
select id from public.providers where type = 'GUIDE'
on conflict (provider_id) do nothing;

-- 4. Trigger on bookings INSERT to notify the provider immediately
create or replace function private.create_provider_booking_request_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  provider_user_id uuid;
  traveler_name text;
begin
  if new.status <> 'PENDING' then
    return new;
  end if;

  select p.user_id, coalesce(nullif(t.full_name, ''), 'A traveler')
  into provider_user_id, traveler_name
  from public.providers p
  left join public.profiles t on t.id = new.traveler_id
  where p.id = new.provider_id;

  if provider_user_id is not null then
    insert into public.notifications (recipient_id, booking_id, kind, message)
    values (provider_user_id, new.id, 'BOOKING_REQUESTED', traveler_name || ' sent a booking request.');
  end if;
  return new;
end;
$$;

drop trigger if exists create_provider_booking_request_notification on public.bookings;
create trigger create_provider_booking_request_notification
after insert on public.bookings
for each row execute function private.create_provider_booking_request_notification();

revoke all on function private.create_provider_booking_request_notification() from public, anon, authenticated;

-- 5. Update list_provider_booking_requests with LEFT JOIN on profiles so missing profile fields don't drop requests
create or replace function private.list_provider_booking_requests()
returns table (
  id uuid, traveler_id uuid, traveler_name text, traveler_avatar_url text,
  service_type public.service_type, start_date date, duration_days integer,
  traveler_count integer, status public.booking_status, created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select b.id, b.traveler_id, coalesce(nullif(t.full_name, ''), 'TourismuBD traveler'),
         t.avatar_url, b.service_type, b.start_date, b.duration_days,
         b.traveler_count, b.status, b.created_at
  from public.bookings b
  join public.providers p on p.id = b.provider_id
  left join public.profiles t on t.id = b.traveler_id
  where p.user_id = auth.uid();
$$;

revoke all on function private.list_provider_booking_requests() from public, anon;
grant execute on function private.list_provider_booking_requests() to authenticated, service_role;

create or replace view public.provider_booking_requests
with (security_barrier = true, security_invoker = true)
as select * from private.list_provider_booking_requests();

grant select on public.provider_booking_requests to authenticated, service_role;

-- 6. Backfill: Insert BOOKING_REQUESTED notification for any existing PENDING bookings that haven't been notified yet
insert into public.notifications (recipient_id, booking_id, kind, message)
select
  p.user_id,
  b.id,
  'BOOKING_REQUESTED',
  coalesce(nullif(t.full_name, ''), 'A traveler') || ' sent a booking request.'
from public.bookings b
join public.providers p on p.id = b.provider_id
left join public.profiles t on t.id = b.traveler_id
where b.status = 'PENDING'
  and p.user_id is not null
  and not exists (
    select 1 from public.notifications n
    where n.recipient_id = p.user_id
      and n.booking_id = b.id
      and n.kind = 'BOOKING_REQUESTED'
  );
