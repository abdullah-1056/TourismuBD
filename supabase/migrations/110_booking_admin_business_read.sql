-- Allow Booking Admins to view business details needed in booking workflows
-- without granting independent management, insert, update, or delete privileges.
drop policy if exists businesses_booking_admin_select on public.businesses;
create policy businesses_booking_admin_select on public.businesses for select to authenticated
using (public.can_access_admin_module('bookings'));

-- Allow Booking Admins to view profiles of customers, providers, and businesses
-- required for booking workflows, without granting write, update, or delete access.
drop policy if exists profiles_booking_admin_select on public.profiles;
create policy profiles_booking_admin_select on public.profiles for select to authenticated
using (public.can_access_admin_module('bookings') and (
  exists (select 1 from public.bookings where traveler_id = profiles.id)
  or exists (select 1 from public.providers where user_id = profiles.id)
  or exists (select 1 from public.businesses where user_id = profiles.id)
));
