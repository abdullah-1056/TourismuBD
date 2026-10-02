-- Admin-only invitations create a sign-in identity without exposing that identity
-- through the public TourismuBD experience.

alter table public.profiles
  add column if not exists is_admin_only boolean not null default false;

alter table public.admin_accounts
  alter column user_id drop not null;

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
  normalized_email text := lower(trim(admin_email));
  target_user_id uuid;
  target_role public.app_role;
  account_id uuid;
begin
  perform private.require_super_admin_management();

  if normalized_email is null or normalized_email = '' then
    raise exception 'Enter an email address';
  end if;
  if admin_role not in ('users_admin', 'business_admin', 'provider_admin', 'subscription_admin', 'booking_admin') then
    raise exception 'Choose a valid Secondary Admin role';
  end if;

  select id, role into target_user_id, target_role
  from public.profiles
  where lower(email) = normalized_email
  limit 1;

  if found and target_role = 'SUPER_ADMIN' then
    raise exception 'A Super Admin cannot be managed as a Secondary Admin';
  end if;

  select id into account_id
  from public.admin_accounts
  where lower(email) = normalized_email
     or (target_user_id is not null and user_id = target_user_id)
  limit 1
  for update;

  if found then
    update public.admin_accounts
    set user_id = target_user_id,
        email = normalized_email,
        role = admin_role,
        is_active = active,
        updated_at = now()
    where id = account_id;
  else
    insert into public.admin_accounts (user_id, email, role, is_active)
    values (target_user_id, normalized_email, admin_role, active)
    returning id into account_id;
  end if;
  return account_id;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := upper(coalesce(new.raw_user_meta_data ->> 'role', 'TRAVELER'));
  assigned_role public.app_role := 'TRAVELER';
  assigned_provider_type public.provider_type;
  signup_phone text := nullif(new.raw_user_meta_data ->> 'phone', '');
  normalized_signup_phone text;
  is_admin_invitation boolean := new.email is not null and exists (
    select 1 from public.admin_accounts
    where user_id is null and lower(email) = lower(new.email)
  );
begin
  if not is_admin_invitation and (signup_phone is null or signup_phone !~ '^(\+880|0)1[3-9][0-9]{8}$') then
    raise exception 'A valid Bangladesh phone number is required for every account';
  end if;
  normalized_signup_phone := case when signup_phone like '+880%' then '0' || substring(signup_phone from 5) else signup_phone end;

  if exists (
    select 1
    from public.profiles blocked_profile
    where blocked_profile.status = 'SUSPENDED'
      and (
        (new.email is not null and lower(blocked_profile.email) = lower(new.email))
        or (normalized_signup_phone is not null and case when blocked_profile.phone like '+880%' then '0' || substring(blocked_profile.phone from 5) else blocked_profile.phone end = normalized_signup_phone)
      )
  ) then
    raise exception 'This account cannot be created with the supplied contact details';
  end if;

  if not is_admin_invitation then
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
  values (
    new.id,
    assigned_role,
    case when is_admin_invitation then 'Admin' else coalesce(new.raw_user_meta_data ->> 'full_name', '') end,
    new.email,
    signup_phone,
    is_admin_invitation
  )
  on conflict (id) do nothing;

  if new.email is not null then
    update public.admin_accounts
    set user_id = new.id,
        email = lower(new.email),
        updated_at = now()
    where user_id is null
      and lower(email) = lower(new.email);
  end if;

  if assigned_provider_type is not null then
    insert into public.providers (user_id, type, display_name, contact_email, contact_phone)
    values (new.id, assigned_provider_type, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.email, signup_phone)
    on conflict (user_id) do nothing;
  elsif assigned_role = 'BUSINESS_OWNER' then
    insert into public.businesses (user_id, business_name, district, contact_email, contact_phone)
    values (
      new.id,
      coalesce(nullif(new.raw_user_meta_data ->> 'business_name', ''), nullif(new.raw_user_meta_data ->> 'full_name', ''), 'Business'),
      nullif(new.raw_user_meta_data ->> 'district', ''),
      new.email,
      signup_phone
    )
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

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
    if new.is_admin_only is distinct from old.is_admin_only then
      raise exception 'Only SUPER_ADMIN may change Admin-only visibility';
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

create or replace function private.validate_profile_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.follower_id <> auth.uid() or not exists (
    select 1 from public.profiles
    where id = new.following_id
      and status = 'ACTIVE'
      and role <> 'SUPER_ADMIN'
      and not is_admin_only
  ) then
    raise exception 'You can only follow active traveler and provider accounts';
  end if;
  return new;
end;
$$;

create or replace function private.validate_social_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  author_role public.app_role;
  author_status public.account_status;
  author_is_admin_only boolean;
begin
  select role, status, is_admin_only into author_role, author_status, author_is_admin_only
  from public.profiles where id = new.author_id;
  if new.author_id <> auth.uid() or author_role is null or author_role = 'SUPER_ADMIN'
     or author_status <> 'ACTIVE' or author_is_admin_only then
    raise exception 'Only active traveler and provider accounts can publish posts';
  end if;
  if author_role <> 'TRAVELER' then new.audience := 'PUBLIC'; end if;
  return new;
end;
$$;

create or replace function private.can_view_social_post(target_author_id uuid, target_audience public.post_audience)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles author
    where author.id = target_author_id
      and author.status = 'ACTIVE'
      and author.role <> 'SUPER_ADMIN'
      and not author.is_admin_only
      and (
        target_audience = 'PUBLIC'
        or exists (
          select 1 from public.profiles viewer
          where viewer.id = auth.uid()
            and viewer.status = 'ACTIVE'
            and viewer.role not in ('TRAVELER', 'SUPER_ADMIN')
        )
        or exists (
          select 1 from public.profile_follows
          where follower_id = auth.uid() and following_id = target_author_id
        )
      )
  );
$$;

create or replace function private.list_public_people_with_followers()
returns table (
  id uuid, full_name text, role public.app_role, avatar_url text, bio text, district text,
  email text, phone text, blood_group text, gender text, working_place text, hobby text,
  present_address text, permanent_address text, follower_count integer, followers_visible boolean,
  profile_photo_urls text[], rating_average numeric, rating_count integer
)
language sql stable security definer set search_path = public as $$
  select u.id, coalesce(nullif(p.display_name, ''), u.full_name), u.role, u.avatar_url,
         coalesce(p.bio, u.bio), u.district, u.email, u.phone, u.blood_group, u.gender,
         u.working_place, u.hobby, u.present_address, u.permanent_address,
         count(f.follower_id)::integer, u.followers_visible, u.profile_photo_urls,
         coalesce(ratings.average_rating, 0), coalesce(ratings.rating_count, 0)
  from public.profiles u
  left join public.providers p on p.user_id = u.id
  left join public.profile_follows f on f.following_id = u.id
  left join lateral (
    select round(avg(r.rating)::numeric, 1) as average_rating, count(*)::integer as rating_count
    from public.reviews r
    join public.bookings b on b.id = r.booking_id
    where b.provider_id = p.id and r.status = 'PUBLISHED'
  ) ratings on true
  where u.status = 'ACTIVE' and u.role <> 'SUPER_ADMIN' and not u.is_admin_only
  group by u.id, p.display_name, p.bio, ratings.average_rating, ratings.rating_count;
$$;

drop view if exists public.public_provider_details;
drop function if exists private.list_public_provider_details();

create function private.list_public_provider_details()
returns table (
  id uuid, user_id uuid, type public.provider_type, display_name text, service_name text, bio text, photo_url text,
  identity_verified boolean, rating_average numeric, rating_count integer, district text,
  email text, phone text, blood_group text, gender text, working_place text, hobby text,
  present_address text, permanent_address text
)
language sql stable security definer set search_path = public as $$
  select p.id, p.user_id, p.type, p.display_name, p.service_name, p.bio, p.photo_url, true,
         coalesce(ratings.average_rating, 0), coalesce(ratings.rating_count, 0),
         u.district, u.email, u.phone, u.blood_group, u.gender, u.working_place,
         u.hobby, u.present_address, u.permanent_address
  from public.providers p
  join public.profiles u on u.id = p.user_id
  left join lateral (
    select round(avg(r.rating)::numeric, 1) as average_rating, count(*)::integer as rating_count
    from public.reviews r
    join public.bookings b on b.id = r.booking_id
    where b.provider_id = p.id and r.status = 'PUBLISHED'
  ) ratings on true
  where public.is_provider_discoverable(p.id) and not u.is_admin_only;
$$;

create view public.public_provider_details with (security_barrier = true, security_invoker = true)
as select * from private.list_public_provider_details();

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke all on function private.validate_profile_follow() from public, anon, authenticated;
revoke all on function private.validate_social_post() from public, anon, authenticated;
revoke all on function private.can_view_social_post(uuid, public.post_audience) from public, anon, authenticated;
revoke all on function private.list_public_people_with_followers() from public;
revoke all on function private.list_public_provider_details() from public;
grant execute on function private.validate_profile_follow() to authenticated;
grant execute on function private.validate_social_post() to authenticated;
grant execute on function private.can_view_social_post(uuid, public.post_audience) to authenticated;
grant execute on function private.list_public_people_with_followers() to authenticated;
grant execute on function private.list_public_provider_details() to authenticated;
