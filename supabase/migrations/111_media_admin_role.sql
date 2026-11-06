-- Migration 111: Media Admin Role & Permissions
-- Adds 'media_admin' secondary admin role with access strictly limited to the media module.
-- Media Admins cannot access users, providers, businesses, subscriptions, bookings, reports, or admin management.

-- 1. Update check constraint on admin_accounts to allow 'media_admin'
alter table if exists public.admin_accounts
  drop constraint if exists admin_accounts_role_check;

alter table if exists public.admin_accounts
  add constraint admin_accounts_role_check
  check (role in (
    'users_admin',
    'business_admin',
    'provider_admin',
    'subscription_admin',
    'booking_admin',
    'media_admin'
  ));

-- 2. Update can_access_admin_module to recognize 'media' module
create or replace function public.can_access_admin_module(module_name text)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select case
    when private.current_admin_role() = 'super_admin' then true
    when module_name = 'reports' then private.current_admin_role() in (
      'users_admin', 'business_admin', 'provider_admin', 'subscription_admin', 'booking_admin'
    )
    when module_name = 'users' then private.current_admin_role() = 'users_admin'
    when module_name = 'business' then private.current_admin_role() = 'business_admin'
    when module_name = 'providers' then private.current_admin_role() = 'provider_admin'
    when module_name = 'subscriptions' then private.current_admin_role() = 'subscription_admin'
    when module_name = 'bookings' then private.current_admin_role() = 'booking_admin'
    when module_name = 'media' then private.current_admin_role() = 'media_admin'
    else false
  end;
$$;

-- 3. Update assign_secondary_admin to allow 'media_admin'
create or replace function public.assign_secondary_admin(
  admin_email text,
  admin_role text,
  active boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public, private
as $$
declare
  target_profile public.profiles%rowtype;
  account_id uuid;
begin
  perform private.require_super_admin_management();

  if admin_role not in ('users_admin', 'business_admin', 'provider_admin', 'subscription_admin', 'booking_admin', 'media_admin') then
    raise exception 'Choose a valid Secondary Admin role';
  end if;

  select * into target_profile
  from public.profiles
  where lower(email) = lower(trim(admin_email))
    and not is_admin_only;

  if not found then
    raise exception 'A registered traveler, provider, or business account is required before assigning Admin access';
  end if;

  if target_profile.status = 'DEACTIVATED' then
    raise exception 'Deactivated accounts cannot receive Admin access';
  end if;

  if target_profile.status = 'SUSPENDED' then
    raise exception 'Suspended accounts cannot receive Admin access';
  end if;

  if target_profile.role = 'SUPER_ADMIN' then
    raise exception 'A Super Admin cannot be managed as a Secondary Admin';
  end if;

  insert into public.admin_accounts (user_id, email, role, is_active)
  values (target_profile.id, lower(target_profile.email), admin_role, active)
  on conflict (user_id) do update
    set email = excluded.email,
        role = excluded.role,
        is_active = excluded.is_active,
        updated_at = now()
  returning id into account_id;

  return account_id;
end;
$$;

-- 4. Storage Bucket & Policies for System and Place Media
insert into storage.buckets (id, name, public)
values ('system-media', 'system-media', true)
on conflict (id) do update set public = true;

-- Public can view system-media
drop policy if exists "system_media_public_select" on storage.objects;
create policy "system_media_public_select" on storage.objects
  for select to public
  using (bucket_id = 'system-media');

-- Super Admin and Media Admin can upload/update/delete media in system-media
drop policy if exists "system_media_admin_manage" on storage.objects;
create policy "system_media_admin_manage" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'system-media'
    and (public.is_super_admin() or public.can_access_admin_module('media'))
  )
  with check (
    bucket_id = 'system-media'
    and (public.is_super_admin() or public.can_access_admin_module('media'))
  );

-- 5. RLS Policies for Media Admin to update places image and scenic gallery fields
drop policy if exists places_media_admin_select on public.places;
create policy places_media_admin_select on public.places
  for select to authenticated
  using (public.can_access_admin_module('media'));

drop policy if exists places_media_admin_update on public.places;
create policy places_media_admin_update on public.places
  for update to authenticated
  using (public.can_access_admin_module('media'))
  with check (public.can_access_admin_module('media'));

-- Media Admin can read and update water bodies photos
drop policy if exists water_bodies_media_admin_manage on public.water_bodies;
create policy water_bodies_media_admin_manage on public.water_bodies
  for all to authenticated
  using (public.can_access_admin_module('media'))
  with check (public.can_access_admin_module('media'));

