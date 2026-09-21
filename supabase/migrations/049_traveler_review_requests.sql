drop view if exists public.traveler_review_requests;
drop function if exists private.list_traveler_review_requests();

create function private.list_traveler_review_requests()
returns table (
  id uuid, provider_name text, service_type public.service_type, completed_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select b.id, coalesce(nullif(p.display_name, ''), 'Your provider'), b.service_type, b.updated_at
  from public.bookings b
  join public.providers p on p.id = b.provider_id
  where b.traveler_id = auth.uid()
    and b.status = 'COMPLETED'
    and not exists (select 1 from public.reviews r where r.booking_id = b.id);
$$;

create view public.traveler_review_requests
with (security_barrier = true, security_invoker = true)
as select * from private.list_traveler_review_requests();

revoke all on function private.list_traveler_review_requests() from public, anon;
grant execute on function private.list_traveler_review_requests() to authenticated;
grant select on public.traveler_review_requests to authenticated;
