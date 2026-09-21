create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  kind text not null check (kind in ('BOOKING_CONFIRMED', 'BOOKING_COMPLETED', 'BOOKING_CANCELLED')),
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_created_idx
  on public.notifications (recipient_id, created_at desc);

create or replace function private.create_booking_status_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  provider_name text;
begin
  if new.status is not distinct from old.status or new.status not in ('CONFIRMED', 'COMPLETED', 'CANCELLED') then
    return new;
  end if;

  select display_name into provider_name from public.providers where id = new.provider_id;
  insert into public.notifications (recipient_id, booking_id, kind, message)
  values (
    new.traveler_id,
    new.id,
    'BOOKING_' || new.status::text,
    case new.status
      when 'CONFIRMED' then coalesce(nullif(provider_name, ''), 'Your provider') || ' confirmed your booking request.'
      when 'COMPLETED' then coalesce(nullif(provider_name, ''), 'Your provider') || ' marked your booking as completed.'
      when 'CANCELLED' then coalesce(nullif(provider_name, ''), 'Your provider') || ' cancelled your booking request.'
    end
  );
  return new;
end;
$$;

drop trigger if exists create_booking_status_notification on public.bookings;
create trigger create_booking_status_notification
after update of status on public.bookings
for each row execute function private.create_booking_status_notification();

create or replace function private.protect_notification_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.recipient_id is distinct from old.recipient_id
     or new.booking_id is distinct from old.booking_id
     or new.kind is distinct from old.kind
     or new.message is distinct from old.message
     or new.created_at is distinct from old.created_at then
    raise exception 'Notification content cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_notification_fields on public.notifications;
create trigger protect_notification_fields
before update on public.notifications
for each row execute function private.protect_notification_fields();

alter table public.notifications enable row level security;

drop policy if exists notifications_recipient_select on public.notifications;
create policy notifications_recipient_select on public.notifications for select to authenticated
using (recipient_id = auth.uid());
drop policy if exists notifications_recipient_update on public.notifications;
create policy notifications_recipient_update on public.notifications for update to authenticated
using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

revoke all on function private.create_booking_status_notification() from public, anon, authenticated;
revoke all on function private.protect_notification_fields() from public, anon, authenticated;
