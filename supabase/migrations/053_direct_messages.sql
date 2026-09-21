alter table public.notifications
  alter column booking_id drop not null;

alter table public.notifications
  drop constraint if exists notifications_kind_check;

alter table public.notifications
  add constraint notifications_kind_check
  check (kind in ('BOOKING_REQUESTED', 'BOOKING_CONFIRMED', 'BOOKING_COMPLETED', 'BOOKING_CANCELLED', 'DIRECT_MESSAGE'));

create table public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  sender_name text not null,
  sender_role public.app_role not null,
  sender_provider_type public.provider_type,
  recipient_name text not null,
  recipient_role public.app_role not null,
  recipient_provider_type public.provider_type,
  body text not null check (length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);

create index direct_messages_recipient_created_idx
  on public.direct_messages (recipient_id, created_at desc);

create index direct_messages_sender_created_idx
  on public.direct_messages (sender_id, created_at desc);

create or replace function private.validate_direct_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.sender_id <> auth.uid() then
    raise exception 'Messages can only be sent between active traveler and provider accounts';
  end if;

  select coalesce(nullif(provider.display_name, ''), profile.full_name), profile.role, provider.type
  into new.sender_name, new.sender_role, new.sender_provider_type
  from public.profiles profile
  left join public.providers provider on provider.user_id = profile.id
  where profile.id = new.sender_id and profile.status = 'ACTIVE' and profile.role <> 'SUPER_ADMIN';

  select coalesce(nullif(provider.display_name, ''), profile.full_name), profile.role, provider.type
  into new.recipient_name, new.recipient_role, new.recipient_provider_type
  from public.profiles profile
  left join public.providers provider on provider.user_id = profile.id
  where profile.id = new.recipient_id and profile.status = 'ACTIVE' and profile.role <> 'SUPER_ADMIN';

  if new.sender_role is null or new.recipient_role is null then
    raise exception 'Messages can only be sent between active traveler and provider accounts';
  end if;
  return new;
end;
$$;

create trigger validate_direct_message
before insert on public.direct_messages
for each row execute function private.validate_direct_message();

create or replace function private.create_direct_message_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sender_name text;
begin
  select coalesce(nullif(full_name, ''), 'A TourismuBD member')
  into sender_name
  from public.profiles
  where id = new.sender_id;

  insert into public.notifications (recipient_id, kind, message)
  values (new.recipient_id, 'DIRECT_MESSAGE', sender_name || ': ' || left(new.body, 240));
  return new;
end;
$$;

create trigger create_direct_message_notification
after insert on public.direct_messages
for each row execute function private.create_direct_message_notification();

alter table public.direct_messages enable row level security;

create policy direct_messages_participant_select on public.direct_messages
for select to authenticated
using (sender_id = auth.uid() or recipient_id = auth.uid());

create policy direct_messages_sender_insert on public.direct_messages
for insert to authenticated
with check (sender_id = auth.uid());

revoke all on function private.validate_direct_message() from public, anon, authenticated;
revoke all on function private.create_direct_message_notification() from public, anon, authenticated;
