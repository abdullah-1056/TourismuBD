create or replace function private.list_public_provider_profiles()
returns table (id uuid, type public.provider_type, display_name text, bio text, photo_url text, identity_verified boolean)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.type, p.display_name, p.bio, p.photo_url, true
  from public.providers p
  where public.is_provider_discoverable(p.id);
$$;

create or replace function private.list_public_reviews()
returns table (id uuid, provider_id uuid, service_type public.service_type, houseboat_listing_id uuid, small_boat_listing_id uuid, rating smallint, comment text, created_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select r.id, b.provider_id, b.service_type, b.houseboat_listing_id,
         b.small_boat_listing_id, r.rating, r.comment, r.created_at
  from public.reviews r
  join public.bookings b on b.id = r.booking_id
  where r.status = 'PUBLISHED';
$$;

create or replace view public.public_provider_profiles
with (security_barrier = true, security_invoker = true)
as select * from private.list_public_provider_profiles();

create or replace view public.public_reviews
with (security_barrier = true, security_invoker = true)
as select * from private.list_public_reviews();

grant usage on schema private to anon, authenticated;
revoke all on function private.list_public_provider_profiles() from public;
revoke all on function private.list_public_reviews() from public;
grant execute on function private.list_public_provider_profiles() to anon, authenticated;
grant execute on function private.list_public_reviews() to anon, authenticated;
grant select on public.public_provider_profiles, public.public_reviews to anon, authenticated;
