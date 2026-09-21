alter table public.direct_messages
  add column if not exists sender_name text,
  add column if not exists sender_role public.app_role,
  add column if not exists sender_provider_type public.provider_type,
  add column if not exists recipient_name text,
  add column if not exists recipient_role public.app_role,
  add column if not exists recipient_provider_type public.provider_type;

update public.direct_messages message
set
  sender_name = coalesce(nullif(sender_provider.display_name, ''), sender_profile.full_name, 'TourismuBD member'),
  sender_role = sender_profile.role,
  sender_provider_type = sender_provider.type,
  recipient_name = coalesce(nullif(recipient_provider.display_name, ''), recipient_profile.full_name, 'TourismuBD member'),
  recipient_role = recipient_profile.role,
  recipient_provider_type = recipient_provider.type
from public.profiles sender_profile
left join public.providers sender_provider on sender_provider.user_id = sender_profile.id
cross join public.profiles recipient_profile
left join public.providers recipient_provider on recipient_provider.user_id = recipient_profile.id
where sender_profile.id = message.sender_id
  and recipient_profile.id = message.recipient_id;

alter table public.direct_messages
  alter column sender_name set not null,
  alter column sender_role set not null,
  alter column recipient_name set not null,
  alter column recipient_role set not null;

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

  select coalesce(nullif(provider.display_name, ''), profile.full_name, 'TourismuBD member'), profile.role, provider.type
  into new.sender_name, new.sender_role, new.sender_provider_type
  from public.profiles profile
  left join public.providers provider on provider.user_id = profile.id
  where profile.id = new.sender_id and profile.status = 'ACTIVE' and profile.role <> 'SUPER_ADMIN';

  select coalesce(nullif(provider.display_name, ''), profile.full_name, 'TourismuBD member'), profile.role, provider.type
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

revoke all on function private.validate_direct_message() from public, anon, authenticated;
