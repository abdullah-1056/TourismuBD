-- Ensure deleting any user, provider, business account, or sub-admin cleanly cascades
-- and completely deletes their auth identity and all child data from Supabase.

alter table public.reports
  drop constraint if exists reports_created_by_fkey,
  add constraint reports_created_by_fkey foreign key (created_by)
    references public.profiles(id) on delete cascade;

alter table public.bookings
  drop constraint if exists bookings_traveler_id_fkey,
  add constraint bookings_traveler_id_fkey foreign key (traveler_id)
    references public.profiles(id) on delete cascade;

alter table public.bookings
  drop constraint if exists bookings_provider_id_fkey,
  add constraint bookings_provider_id_fkey foreign key (provider_id)
    references public.providers(id) on delete cascade;

alter table public.bookings
  drop constraint if exists bookings_houseboat_listing_id_fkey,
  add constraint bookings_houseboat_listing_id_fkey foreign key (houseboat_listing_id)
    references public.houseboat_listings(id) on delete set null;

alter table public.bookings
  drop constraint if exists bookings_small_boat_listing_id_fkey,
  add constraint bookings_small_boat_listing_id_fkey foreign key (small_boat_listing_id)
    references public.small_boat_listings(id) on delete set null;

alter table public.reviews
  drop constraint if exists reviews_traveler_id_fkey,
  add constraint reviews_traveler_id_fkey foreign key (traveler_id)
    references public.profiles(id) on delete cascade;

alter table public.reviews
  drop constraint if exists reviews_booking_id_fkey,
  add constraint reviews_booking_id_fkey foreign key (booking_id)
    references public.bookings(id) on delete cascade;
