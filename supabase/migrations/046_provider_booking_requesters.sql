drop view if exists public.provider_booking_requests;
drop function if exists private.list_provider_booking_requests();

create function private.list_provider_booking_requests()
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
  join public.profiles t on t.id = b.traveler_id
  where p.user_id = auth.uid();
$$;

create view public.provider_booking_requests
with (security_barrier = true, security_invoker = true)
as select * from private.list_provider_booking_requests();

revoke all on function private.list_provider_booking_requests() from public, anon;
grant execute on function private.list_provider_booking_requests() to authenticated;
grant select on public.provider_booking_requests to authenticated;
