create table if not exists private.blocked_signup_contacts (
  id bigint generated always as identity primary key,
  module_name text not null check (module_name in ('users', 'providers', 'business')),
  user_id uuid not null,
  contact_kind text not null check (contact_kind in ('email', 'phone')),
  contact_value text not null,
  is_active boolean not null default true,
  blocked_at timestamptz not null default now(),
  restored_at timestamptz
);

create index if not exists blocked_signup_contacts_active_lookup
  on private.blocked_signup_contacts (contact_kind, contact_value)
  where is_active;

alter table private.blocked_signup_contacts enable row level security;
revoke all on private.blocked_signup_contacts from public, anon, authenticated;

create or replace function private.normalize_blocked_signup_phone(value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when regexp_replace(coalesce(value, ''), '\D', '', 'g') like '8801%' then '0' || substring(regexp_replace(value, '\D', '', 'g') from 4)
    else regexp_replace(coalesce(value, ''), '\D', '', 'g')
  end;
$$;

create or replace function private.record_blocked_signup_contact(
  target_module text,
  account_user_id uuid,
  account_email text,
  account_phone text
)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
declare
  normalized_email text := nullif(lower(trim(account_email)), '');
  normalized_phone text := nullif(private.normalize_blocked_signup_phone(account_phone), '');
begin
  if normalized_email is not null and not exists (
    select 1 from private.blocked_signup_contacts
    where is_active and user_id = account_user_id and module_name = target_module
      and contact_kind = 'email' and contact_value = normalized_email
  ) then
    insert into private.blocked_signup_contacts (module_name, user_id, contact_kind, contact_value)
    values (target_module, account_user_id, 'email', normalized_email);
  end if;
  if normalized_phone is not null and not exists (
    select 1 from private.blocked_signup_contacts
    where is_active and user_id = account_user_id and module_name = target_module
      and contact_kind = 'phone' and contact_value = normalized_phone
  ) then
    insert into private.blocked_signup_contacts (module_name, user_id, contact_kind, contact_value)
    values (target_module, account_user_id, 'phone', normalized_phone);
  end if;
end;
$$;

create or replace function private.track_blocked_profile_contacts()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if old.status is distinct from 'SUSPENDED'::public.account_status
     and new.status = 'SUSPENDED'::public.account_status then
    perform private.record_blocked_signup_contact('users', new.id, new.email, new.phone);
  elsif old.status = 'SUSPENDED'::public.account_status
     and new.status is distinct from 'SUSPENDED'::public.account_status then
    update private.blocked_signup_contacts
    set is_active = false, restored_at = now()
    where module_name = 'users' and user_id = new.id and is_active;
  end if;
  return new;
end;
$$;

create or replace function private.track_blocked_provider_contacts()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  profile public.profiles%rowtype;
begin
  if old.account_status is distinct from 'REMOVED'::public.account_status
     and new.account_status = 'REMOVED'::public.account_status then
    select * into profile from public.profiles where id = new.user_id;
    perform private.record_blocked_signup_contact('providers', new.user_id, profile.email, profile.phone);
    perform private.record_blocked_signup_contact('providers', new.user_id, new.contact_email, new.contact_phone);
  elsif old.account_status = 'REMOVED'::public.account_status
     and new.account_status is distinct from 'REMOVED'::public.account_status then
    update private.blocked_signup_contacts
    set is_active = false, restored_at = now()
    where module_name = 'providers' and user_id = new.user_id and is_active;
  end if;
  return new;
end;
$$;

create or replace function private.track_blocked_business_contacts()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  profile public.profiles%rowtype;
begin
  if old.account_status is distinct from 'REMOVED'::public.account_status
     and new.account_status = 'REMOVED'::public.account_status then
    select * into profile from public.profiles where id = new.user_id;
    perform private.record_blocked_signup_contact('business', new.user_id, profile.email, profile.phone);
    perform private.record_blocked_signup_contact('business', new.user_id, new.contact_email, new.contact_phone);
  elsif old.account_status = 'REMOVED'::public.account_status
     and new.account_status is distinct from 'REMOVED'::public.account_status then
    update private.blocked_signup_contacts
    set is_active = false, restored_at = now()
    where module_name = 'business' and user_id = new.user_id and is_active;
  end if;
  return new;
end;
$$;

drop trigger if exists track_blocked_profile_contacts on public.profiles;
create trigger track_blocked_profile_contacts
after update of status on public.profiles
for each row execute function private.track_blocked_profile_contacts();

drop trigger if exists track_blocked_provider_contacts on public.providers;
create trigger track_blocked_provider_contacts
after update of account_status on public.providers
for each row execute function private.track_blocked_provider_contacts();

drop trigger if exists track_blocked_business_contacts on public.businesses;
create trigger track_blocked_business_contacts
after update of account_status on public.businesses
for each row execute function private.track_blocked_business_contacts();

revoke execute on function private.record_blocked_signup_contact(text, uuid, text, text) from public, anon, authenticated;
revoke execute on function private.track_blocked_profile_contacts() from public, anon, authenticated;
revoke execute on function private.track_blocked_provider_contacts() from public, anon, authenticated;
revoke execute on function private.track_blocked_business_contacts() from public, anon, authenticated;

-- Backfill accounts already blocked before contact tracking was installed.
do $$
declare
  blocked record;
begin
  for blocked in select id, email, phone from public.profiles where status = 'SUSPENDED' loop
    perform private.record_blocked_signup_contact('users', blocked.id, blocked.email, blocked.phone);
  end loop;
  for blocked in
    select provider.user_id, profile.email as profile_email, profile.phone as profile_phone,
      provider.contact_email, provider.contact_phone
    from public.providers provider join public.profiles profile on profile.id = provider.user_id
    where provider.account_status = 'REMOVED'
  loop
    perform private.record_blocked_signup_contact('providers', blocked.user_id, blocked.profile_email, blocked.profile_phone);
    perform private.record_blocked_signup_contact('providers', blocked.user_id, blocked.contact_email, blocked.contact_phone);
  end loop;
  for blocked in
    select business.user_id, profile.email as profile_email, profile.phone as profile_phone,
      business.contact_email, business.contact_phone
    from public.businesses business join public.profiles profile on profile.id = business.user_id
    where business.account_status = 'REMOVED'
  loop
    perform private.record_blocked_signup_contact('business', blocked.user_id, blocked.profile_email, blocked.profile_phone);
    perform private.record_blocked_signup_contact('business', blocked.user_id, blocked.contact_email, blocked.contact_phone);
  end loop;
end;
$$;

create or replace function private.is_blocked_signup_contact(signup_email text, signup_phone text)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1 from private.blocked_signup_contacts blocked
    where blocked.is_active and (
      (nullif(lower(trim(signup_email)), '') is not null and blocked.contact_kind = 'email'
        and blocked.contact_value = lower(trim(signup_email)))
      or (nullif(private.normalize_blocked_signup_phone(signup_phone), '') is not null
        and blocked.contact_kind = 'phone'
        and blocked.contact_value = private.normalize_blocked_signup_phone(signup_phone))
    )
  ) or exists (
    select 1 from public.profiles profile
    where profile.status = 'SUSPENDED' and (
      (nullif(lower(trim(signup_email)), '') is not null and lower(profile.email) = lower(trim(signup_email)))
      or (nullif(private.normalize_blocked_signup_phone(signup_phone), '') is not null
        and private.normalize_blocked_signup_phone(profile.phone) = private.normalize_blocked_signup_phone(signup_phone))
    )
  ) or exists (
    select 1 from public.providers provider
    where provider.account_status = 'REMOVED' and (
      (nullif(lower(trim(signup_email)), '') is not null and (
        lower(provider.contact_email) = lower(trim(signup_email)) or exists (
          select 1 from public.profiles profile where profile.id = provider.user_id and lower(profile.email) = lower(trim(signup_email))
        )
      ))
      or (nullif(private.normalize_blocked_signup_phone(signup_phone), '') is not null and (
        private.normalize_blocked_signup_phone(provider.contact_phone) = private.normalize_blocked_signup_phone(signup_phone) or exists (
          select 1 from public.profiles profile where profile.id = provider.user_id
            and private.normalize_blocked_signup_phone(profile.phone) = private.normalize_blocked_signup_phone(signup_phone)
        )
      ))
    )
  ) or exists (
    select 1 from public.businesses business
    where business.account_status = 'REMOVED' and (
      (nullif(lower(trim(signup_email)), '') is not null and (
        lower(business.contact_email) = lower(trim(signup_email)) or exists (
          select 1 from public.profiles profile where profile.id = business.user_id and lower(profile.email) = lower(trim(signup_email))
        )
      ))
      or (nullif(private.normalize_blocked_signup_phone(signup_phone), '') is not null and (
        private.normalize_blocked_signup_phone(business.contact_phone) = private.normalize_blocked_signup_phone(signup_phone) or exists (
          select 1 from public.profiles profile where profile.id = business.user_id
            and private.normalize_blocked_signup_phone(profile.phone) = private.normalize_blocked_signup_phone(signup_phone)
        )
      ))
    )
  );
$$;

revoke execute on function private.is_blocked_signup_contact(text, text) from public, anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  requested_role text := upper(coalesce(new.raw_user_meta_data ->> 'role', 'TRAVELER'));
  assigned_role public.app_role := 'TRAVELER';
  assigned_provider_type public.provider_type;
  signup_phone text := nullif(new.raw_user_meta_data ->> 'phone', '');
  is_super_admin_invitation boolean := new.email is not null and exists (
    select 1 from private.super_admin_invitations where email = lower(new.email) and consumed_at is null
  );
  is_secondary_admin_invitation boolean := new.email is not null and exists (
    select 1 from public.admin_accounts where user_id is null and lower(email) = lower(new.email)
  );
  is_admin_invitation boolean;
begin
  is_admin_invitation := is_super_admin_invitation or is_secondary_admin_invitation;
  if not is_admin_invitation and (signup_phone is null or signup_phone !~ '^(\+880|0)1[3-9][0-9]{8}$') then
    raise exception 'A valid Bangladesh phone number is required for every account';
  end if;

  if not is_admin_invitation and private.is_blocked_signup_contact(new.email, signup_phone) then
    raise exception 'This account cannot be created with the supplied contact details';
  end if;

  if is_super_admin_invitation then
    assigned_role := 'SUPER_ADMIN';
  elsif not is_admin_invitation then
    case requested_role
      when 'TOUR_GUIDE' then assigned_role := 'TOUR_GUIDE'; assigned_provider_type := 'GUIDE';
      when 'HOUSEBOAT_OWNER' then assigned_role := 'HOUSEBOAT_OWNER'; assigned_provider_type := 'HOUSEBOAT_OWNER';
      when 'SMALL_BOAT_OWNER' then assigned_role := 'SMALL_BOAT_OWNER'; assigned_provider_type := 'SMALL_BOAT_OWNER';
      when 'RESORT_HOTEL_OWNER' then assigned_role := 'RESORT_HOTEL_OWNER'; assigned_provider_type := 'RESORT_HOTEL_OWNER';
      when 'CAR_TRANSPORT_OWNER' then assigned_role := 'CAR_TRANSPORT_OWNER'; assigned_provider_type := 'CAR_TRANSPORT_OWNER';
      when 'PARKING_OWNER' then assigned_role := 'PARKING_OWNER'; assigned_provider_type := 'PARKING_OWNER';
      when 'TOUR_AGENCY' then assigned_role := 'TOUR_AGENCY'; assigned_provider_type := 'TOUR_AGENCY_ORGANIZATION';
      when 'BUSINESS_OWNER' then assigned_role := 'BUSINESS_OWNER'; assigned_provider_type := null;
      else assigned_role := 'TRAVELER'; assigned_provider_type := null;
    end case;
  end if;

  insert into public.profiles (id, role, full_name, email, phone, is_admin_only)
  values (new.id, assigned_role, case when is_admin_invitation then 'Admin' else coalesce(new.raw_user_meta_data ->> 'full_name', '') end, new.email, signup_phone, is_admin_invitation)
  on conflict (id) do nothing;

  if is_super_admin_invitation then
    update private.super_admin_invitations set consumed_at = now() where email = lower(new.email);
  end if;
  if new.email is not null then
    update public.admin_accounts set user_id = new.id, email = lower(new.email), updated_at = now()
    where user_id is null and lower(email) = lower(new.email);
  end if;
  if assigned_provider_type is not null then
    insert into public.providers (user_id, type, display_name, contact_email, contact_phone)
    values (new.id, assigned_provider_type, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.email, signup_phone)
    on conflict (user_id) do nothing;
  elsif assigned_role = 'BUSINESS_OWNER' then
    insert into public.businesses (user_id, business_name, district, contact_email, contact_phone)
    values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'business_name', ''), nullif(new.raw_user_meta_data ->> 'full_name', ''), 'Business'), nullif(new.raw_user_meta_data ->> 'district', ''), new.email, signup_phone)
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
