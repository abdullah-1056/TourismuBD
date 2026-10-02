-- Booking Admins may review and resolve only reports attached to a booking.
create or replace function public.can_view_booking_report(report_booking_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select private.current_admin_role() in ('super_admin', 'booking_admin')
    and exists (select 1 from public.bookings where id = report_booking_id);
$$;

grant execute on function public.can_view_booking_report(uuid) to authenticated, service_role;

drop policy if exists reports_targeted_admin_select on public.reports;
create policy reports_targeted_admin_select on public.reports for select to authenticated
using (
  public.can_view_report(social_post_id, provider_id)
  or public.can_view_booking_report(booking_id)
);

drop policy if exists reports_targeted_admin_update on public.reports;
create policy reports_targeted_admin_update on public.reports for update to authenticated
using (
  public.can_view_report(social_post_id, provider_id)
  or public.can_view_booking_report(booking_id)
)
with check (
  public.can_view_report(social_post_id, provider_id)
  or public.can_view_booking_report(booking_id)
);

-- The original booking validator treated only Super Admin as an Admin. Extend
-- that bypass to Booking Admins while preserving booking validation rules.
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
    if not exists (select 1 from public.guide_profiles where provider_id = new.provider_id) then
      raise exception 'Guide profile is required';
    end if;
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
        elsif new.status <> 'CANCELLED' or old.status not in ('PENDING', 'CONFIRMED') then
          raise exception 'Traveler may only cancel an active booking';
        end if;
      else
        raise exception 'Not a booking party';
      end if;
    end if;
  end if;

  if tg_op = 'INSERT' or (old.status = 'PENDING' and new.status = 'CONFIRMED') then
    if not public.is_provider_discoverable(new.provider_id) then
      raise exception 'Provider must be approved, active, published, and subscribed';
    end if;
  end if;

  if tg_op = 'UPDATE' and new.status = 'CANCELLED' and old.status <> 'CANCELLED' then
    new.cancelled_by = coalesce(new.cancelled_by, auth.uid());
    new.cancelled_at = coalesce(new.cancelled_at, now());
  elsif new.status <> 'CANCELLED' then
    new.cancelled_by = null;
    new.cancelled_at = null;
    new.cancellation_reason = null;
  end if;
  return new;
end;
$$;
