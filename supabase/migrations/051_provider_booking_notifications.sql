alter table public.notifications
  drop constraint if exists notifications_kind_check;

alter table public.notifications
  add constraint notifications_kind_check
  check (kind in ('BOOKING_REQUESTED', 'BOOKING_CONFIRMED', 'BOOKING_COMPLETED', 'BOOKING_CANCELLED'));

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
  join public.profiles t on t.id = new.traveler_id
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

insert into public.notifications (recipient_id, booking_id, kind, message)
select
  p.user_id,
  b.id,
  'BOOKING_REQUESTED',
  coalesce(nullif(t.full_name, ''), 'A traveler') || ' sent a booking request.'
from public.bookings b
join public.providers p on p.id = b.provider_id
join public.profiles t on t.id = b.traveler_id
where b.status = 'PENDING'
  and not exists (
    select 1 from public.notifications n
    where n.recipient_id = p.user_id
      and n.booking_id = b.id
      and n.kind = 'BOOKING_REQUESTED'
  );

revoke all on function private.create_provider_booking_request_notification() from public, anon, authenticated;
