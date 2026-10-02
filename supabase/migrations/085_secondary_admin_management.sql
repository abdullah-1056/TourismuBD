-- Secondary Admin accounts are separate from public account roles. A person must
-- already have a TourismuBD account before a Super Admin can assign Admin access.

create table if not exists public.admin_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  email text not null,
  role text not null check (role in (
    'users_admin',
    'business_admin',
    'provider_admin',
    'subscription_admin',
    'booking_admin'
  )),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists admin_accounts_email_lower_key
  on public.admin_accounts (lower(email));

create trigger set_admin_accounts_updated_at
before update on public.admin_accounts
for each row execute function public.set_updated_at();

alter table public.admin_accounts enable row level security;

create or replace function private.current_admin_role()
returns text
language sql
stable
security definer
set search_path = public, private
as $$
  select coalesce(
    (
      select 'super_admin'
      from public.profiles
      where id = auth.uid()
        and role = 'SUPER_ADMIN'
        and status = 'ACTIVE'
    ),
    (
      select account.role
      from public.admin_accounts account
      join public.profiles profile on profile.id = account.user_id
      where account.user_id = auth.uid()
        and account.is_active
        and profile.status = 'ACTIVE'
    )
  );
$$;

create or replace function public.current_admin_access()
returns table (role text, is_active boolean)
language sql
stable
security definer
set search_path = public, private
as $$
  select access.admin_role, true
  from (select private.current_admin_role() as admin_role) access
  where access.admin_role is not null;
$$;

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
    else false
  end;
$$;

create or replace function private.require_super_admin_management()
returns void
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role'
     and private.current_admin_role() <> 'super_admin' then
    raise exception 'Only an active Super Admin can manage Secondary Admin accounts'
      using errcode = '42501';
  end if;
end;
$$;

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

  if admin_role not in ('users_admin', 'business_admin', 'provider_admin', 'subscription_admin', 'booking_admin') then
    raise exception 'Choose a valid Secondary Admin role';
  end if;

  select * into target_profile
  from public.profiles
  where lower(email) = lower(trim(admin_email))
  limit 1;

  if not found then
    raise exception 'This email must first create a TourismuBD account';
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

create or replace function public.remove_secondary_admin(admin_account_id uuid)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
begin
  perform private.require_super_admin_management();
  delete from public.admin_accounts where id = admin_account_id;
  if not found then
    raise exception 'Secondary Admin account not found';
  end if;
end;
$$;

create or replace function private.sync_secondary_admin_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.admin_accounts
    set email = lower(new.email), updated_at = now()
    where user_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists sync_secondary_admin_email on public.profiles;
create trigger sync_secondary_admin_email
after update of email on public.profiles
for each row execute function private.sync_secondary_admin_email();

-- Existing public account role protections remain in place. Users Admins can
-- manage normal user statuses but cannot alter roles or touch Super Admin rows.
create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if auth.uid() is not null and old.role = 'SUPER_ADMIN' and not public.is_super_admin() then
    raise exception 'Only SUPER_ADMIN may modify a Super Admin account';
  end if;

  if auth.uid() is not null and not public.is_super_admin() then
    if new.role is distinct from old.role then
      raise exception 'Only SUPER_ADMIN may change account roles';
    end if;
    if new.status is distinct from old.status and not public.can_access_admin_module('users') then
      raise exception 'Only Users Admins may change user account status';
    end if;
  end if;

  if old.role = 'SUPER_ADMIN' and old.status = 'ACTIVE'
     and (new.role <> 'SUPER_ADMIN' or new.status <> 'ACTIVE')
     and not exists (
       select 1 from public.profiles
       where id <> old.id and role = 'SUPER_ADMIN' and status = 'ACTIVE'
     ) then
    raise exception 'At least one active SUPER_ADMIN is required';
  end if;
  return new;
end;
$$;

create or replace function public.protect_provider_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_super_admin() or public.can_access_admin_module('providers') then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.user_id <> auth.uid() or new.account_status <> 'ACTIVE' or new.public_status <> 'PUBLISHED' then
      raise exception 'New provider accounts must start active and published';
    end if;
  elsif new.user_id is distinct from old.user_id
     or new.type is distinct from old.type
     or new.account_status is distinct from old.account_status
     or new.public_status is distinct from old.public_status then
    raise exception 'Provider account controls are Admin-managed';
  end if;
  return new;
end;
$$;

create or replace function public.protect_business_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_super_admin() or public.can_access_admin_module('business') then
    return new;
  end if;
  if new.user_id is distinct from old.user_id
     or new.account_status is distinct from old.account_status
     or new.public_status is distinct from old.public_status then
    raise exception 'Business approval fields are Admin-controlled';
  end if;
  return new;
end;
$$;

-- Super Admin management is backend-enforced. Secondary Admins receive only
-- their module's records, and Reports remains read-only for every secondary role.
create policy admin_accounts_super_admin_manage on public.admin_accounts for all to authenticated
using (public.is_super_admin()) with check (public.is_super_admin());

create policy profiles_users_admin_select on public.profiles for select to authenticated
using (public.can_access_admin_module('users'));
create policy profiles_users_admin_update on public.profiles for update to authenticated
using (public.can_access_admin_module('users')) with check (public.can_access_admin_module('users'));
create policy profiles_provider_admin_select on public.profiles for select to authenticated
using (public.can_access_admin_module('providers') and exists (
  select 1 from public.providers where user_id = profiles.id
));
create policy profiles_business_admin_select on public.profiles for select to authenticated
using (public.can_access_admin_module('business') and exists (
  select 1 from public.businesses where user_id = profiles.id
));
create policy profiles_subscription_admin_select on public.profiles for select to authenticated
using (public.can_access_admin_module('subscriptions') and exists (
  select 1 from public.providers where user_id = profiles.id
));
create policy profiles_booking_admin_select on public.profiles for select to authenticated
using (public.can_access_admin_module('bookings') and (
  exists (select 1 from public.bookings where traveler_id = profiles.id)
  or exists (select 1 from public.providers where user_id = profiles.id)
));
create policy profiles_reports_admin_select on public.profiles for select to authenticated
using (public.can_access_admin_module('reports') and exists (
  select 1
  from public.social_posts post
  join public.reports report on report.social_post_id = post.id
  where post.author_id = profiles.id
));

create policy providers_provider_admin_manage on public.providers for all to authenticated
using (public.can_access_admin_module('providers')) with check (public.can_access_admin_module('providers'));
create policy providers_subscription_admin_select on public.providers for select to authenticated
using (public.can_access_admin_module('subscriptions'));
create policy providers_booking_admin_select on public.providers for select to authenticated
using (public.can_access_admin_module('bookings'));

create policy provider_verifications_provider_admin_manage on public.provider_verifications for all to authenticated
using (public.can_access_admin_module('providers')) with check (public.can_access_admin_module('providers'));
create policy provider_subscriptions_provider_admin_select on public.provider_subscriptions for select to authenticated
using (public.can_access_admin_module('providers'));
create policy provider_subscriptions_subscription_admin_manage on public.provider_subscriptions for all to authenticated
using (public.can_access_admin_module('subscriptions')) with check (public.can_access_admin_module('subscriptions'));
create policy guide_profiles_provider_admin_manage on public.guide_profiles for all to authenticated
using (public.can_access_admin_module('providers')) with check (public.can_access_admin_module('providers'));
create policy guide_places_provider_admin_manage on public.guide_places for all to authenticated
using (public.can_access_admin_module('providers')) with check (public.can_access_admin_module('providers'));
create policy houseboats_provider_admin_manage on public.houseboat_listings for all to authenticated
using (public.can_access_admin_module('providers')) with check (public.can_access_admin_module('providers'));
create policy houseboat_places_provider_admin_manage on public.houseboat_places for all to authenticated
using (public.can_access_admin_module('providers')) with check (public.can_access_admin_module('providers'));
create policy small_boats_provider_admin_manage on public.small_boat_listings for all to authenticated
using (public.can_access_admin_module('providers')) with check (public.can_access_admin_module('providers'));
create policy small_boat_places_provider_admin_manage on public.small_boat_places for all to authenticated
using (public.can_access_admin_module('providers')) with check (public.can_access_admin_module('providers'));

create policy businesses_business_admin_manage on public.businesses for all to authenticated
using (public.can_access_admin_module('business')) with check (public.can_access_admin_module('business'));
create policy business_products_business_admin_manage on public.business_products for all to authenticated
using (public.can_access_admin_module('business')) with check (public.can_access_admin_module('business'));

create policy bookings_booking_admin_manage on public.bookings for all to authenticated
using (public.can_access_admin_module('bookings')) with check (public.can_access_admin_module('bookings'));

create policy reports_secondary_admin_select on public.reports for select to authenticated
using (public.can_access_admin_module('reports'));
create policy social_posts_reports_admin_select on public.social_posts for select to authenticated
using (public.can_access_admin_module('reports') and exists (
  select 1 from public.reports where social_post_id = social_posts.id
));
create policy social_post_media_reports_admin_select on storage.objects for select to authenticated
using (
  bucket_id = 'social-posts'
  and public.can_access_admin_module('reports')
  and exists (
    select 1
    from public.social_posts post
    join public.reports report on report.social_post_id = post.id
    where post.media_path = name
  )
);

revoke all on function private.current_admin_role() from public, anon, authenticated;
revoke all on function private.require_super_admin_management() from public, anon, authenticated;
revoke all on function private.sync_secondary_admin_email() from public, anon, authenticated;
revoke execute on function public.current_admin_access() from public, anon;
revoke execute on function public.can_access_admin_module(text) from public, anon;
revoke execute on function public.assign_secondary_admin(text, text, boolean) from public, anon;
revoke execute on function public.remove_secondary_admin(uuid) from public, anon;
grant execute on function public.current_admin_access() to authenticated;
grant execute on function public.can_access_admin_module(text) to authenticated;
grant execute on function public.assign_secondary_admin(text, text, boolean) to authenticated;
grant execute on function public.remove_secondary_admin(uuid) to authenticated;
