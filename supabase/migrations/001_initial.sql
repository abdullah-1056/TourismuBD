create extension if not exists pgcrypto;

create type public.app_role as enum (
  'TRAVELER',
  'TOUR_GUIDE',
  'HOUSEBOAT_OWNER',
  'SMALL_BOAT_OWNER',
  'RESORT_HOTEL_OWNER',
  'CAR_TRANSPORT_OWNER',
  'PARKING_OWNER',
  'TOUR_AGENCY',
  'SUPER_ADMIN'
);
create type public.provider_type as enum (
  'GUIDE',
  'HOUSEBOAT_OWNER',
  'SMALL_BOAT_OWNER',
  'RESORT_HOTEL_OWNER',
  'CAR_TRANSPORT_OWNER',
  'PARKING_OWNER',
  'TOUR_AGENCY_ORGANIZATION'
);
create type public.service_type as enum (
  'GUIDE', 'HOUSEBOAT', 'SMALL_BOAT', 'RESORT_HOTEL',
  'CAR_TRANSPORT', 'PARKING', 'TOUR_AGENCY'
);
create type public.record_status as enum ('DRAFT', 'PUBLISHED', 'HIDDEN', 'ARCHIVED');
create type public.account_status as enum ('PENDING', 'ACTIVE', 'SUSPENDED', 'REMOVED');
create type public.verification_status as enum ('PENDING', 'NEEDS_CORRECTION', 'APPROVED', 'REJECTED');
create type public.subscription_status as enum ('ACTIVE', 'GRACE', 'FROZEN');
create type public.booking_status as enum ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');
create type public.review_status as enum ('PUBLISHED', 'HIDDEN', 'REMOVED');
create type public.report_status as enum ('OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED');
create type public.report_category as enum (
  'PROVIDER_PROBLEM', 'BOOKING_PROBLEM', 'SAFETY_CONCERN',
  'FRAUD_MISREPRESENTATION', 'REVIEW_PROBLEM', 'OTHER'
);
create type public.relationship_type as enum ('NEARBY', 'ROUTE');
create type public.water_body_type as enum (
  'HAOR', 'LAKE', 'RIVER', 'BEEL', 'FOREST_WATERWAY', 'CONFLUENCE', 'OTHER'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'TRAVELER',
  full_name text not null default '',
  email text,
  phone text,
  phone_visible boolean not null default false,
  phone_edit_count integer not null default 0 check (phone_edit_count between 0 and 3),
  email_edit_count integer not null default 0 check (email_edit_count between 0 and 3),
  bio text,
  blood_group text,
  gender text,
  present_address text,
  permanent_address text,
  working_place text,
  hobby text,
  avatar_url text,
  status public.account_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.districts (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  division text not null,
  slug text not null unique,
  status public.record_status not null default 'DRAFT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.places (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null references public.districts(id) on delete restrict,
  name text not null,
  slug text not null,
  upazila_or_area text,
  category text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  short_description text,
  best_time text,
  how_to_reach text,
  practical_tips text,
  status public.record_status not null default 'DRAFT',
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (district_id, slug)
);

create table public.place_aliases (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  alias text not null,
  unique (place_id, alias)
);

create table public.place_relationships (
  id uuid primary key default gen_random_uuid(),
  from_place_id uuid not null references public.places(id) on delete cascade,
  to_place_id uuid not null references public.places(id) on delete cascade,
  relationship_type public.relationship_type not null,
  distance_km numeric(7,2),
  travel_minutes integer check (travel_minutes is null or travel_minutes > 0),
  notes text,
  created_at timestamptz not null default now(),
  check (from_place_id <> to_place_id),
  unique (from_place_id, to_place_id, relationship_type)
);

create table public.water_bodies (
  id uuid primary key default gen_random_uuid(),
  primary_district_id uuid not null references public.districts(id) on delete restrict,
  name text not null,
  slug text not null unique,
  type public.water_body_type not null,
  is_sundarbans boolean not null default false,
  short_description text,
  status public.record_status not null default 'DRAFT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.water_body_places (
  water_body_id uuid not null references public.water_bodies(id) on delete cascade,
  place_id uuid not null references public.places(id) on delete cascade,
  primary key (water_body_id, place_id)
);

create table public.saved_trips (
  id uuid primary key default gen_random_uuid(),
  traveler_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  starting_point_type text,
  starting_point_value text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.saved_trip_places (
  id uuid primary key default gen_random_uuid(),
  saved_trip_id uuid not null references public.saved_trips(id) on delete cascade,
  place_id uuid not null references public.places(id) on delete restrict,
  sequence integer not null check (sequence > 0),
  day_number integer check (day_number is null or day_number > 0),
  unique (saved_trip_id, place_id),
  unique (saved_trip_id, sequence)
);

create table public.providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  type public.provider_type not null,
  display_name text not null,
  bio text,
  photo_url text,
  contact_email text not null,
  contact_phone text not null check (contact_phone ~ '^(\+880|0)1[3-9][0-9]{8}$'),
  account_status public.account_status not null default 'PENDING',
  public_status public.record_status not null default 'DRAFT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.provider_verifications (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null unique references public.providers(id) on delete cascade,
  document_path text not null,
  email_verified boolean not null default false,
  phone_verified boolean not null default false,
  identity_checked boolean not null default false,
  service_checked boolean not null default false,
  status public.verification_status not null default 'PENDING',
  provider_note text,
  admin_note text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    status <> 'APPROVED'
    or (email_verified and phone_verified and identity_checked and service_checked
        and reviewed_by is not null and reviewed_at is not null)
  )
);

create table public.provider_subscriptions (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null unique references public.providers(id) on delete cascade,
  provider_type public.provider_type not null,
  monthly_fee_bdt integer generated always as (
    case provider_type
      when 'GUIDE' then 10
      when 'HOUSEBOAT_OWNER' then 100
      when 'SMALL_BOAT_OWNER' then 50
      when 'RESORT_HOTEL_OWNER' then 100
      when 'CAR_TRANSPORT_OWNER' then 50
      when 'PARKING_OWNER' then 30
      when 'TOUR_AGENCY_ORGANIZATION' then 70
    end
  ) stored,
  status public.subscription_status not null default 'FROZEN',
  current_period_start date,
  current_period_end date,
  grace_until date,
  last_payment_at timestamptz,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (current_period_end is null or current_period_start is not null),
  check (current_period_end is null or current_period_end >= current_period_start)
);

create table public.guide_profiles (
  provider_id uuid primary key references public.providers(id) on delete cascade,
  languages text[] not null default '{}',
  approximate_rate_bdt numeric(10,2) check (approximate_rate_bdt is null or approximate_rate_bdt >= 0),
  availability text,
  experience text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.guide_places (
  provider_id uuid not null references public.guide_profiles(provider_id) on delete cascade,
  place_id uuid not null references public.places(id) on delete cascade,
  primary key (provider_id, place_id)
);

create table public.houseboat_listings (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  district_id uuid not null references public.districts(id) on delete restrict,
  water_body_id uuid not null references public.water_bodies(id) on delete restrict,
  name text not null,
  boarding_point text not null,
  capacity integer not null check (capacity > 0),
  approximate_price_bdt numeric(10,2) check (approximate_price_bdt is null or approximate_price_bdt >= 0),
  pricing_unit text,
  facilities text[] not null default '{}',
  availability text,
  notes text,
  status public.record_status not null default 'DRAFT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.houseboat_places (
  listing_id uuid not null references public.houseboat_listings(id) on delete cascade,
  place_id uuid not null references public.places(id) on delete cascade,
  primary key (listing_id, place_id)
);

create table public.small_boat_listings (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  district_id uuid not null references public.districts(id) on delete restrict,
  water_body_id uuid not null references public.water_bodies(id) on delete restrict,
  name text not null,
  boarding_point text not null,
  capacity integer not null check (capacity > 0),
  approximate_price_bdt numeric(10,2) check (approximate_price_bdt is null or approximate_price_bdt >= 0),
  pricing_unit text,
  availability text,
  notes text,
  status public.record_status not null default 'DRAFT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.small_boat_places (
  listing_id uuid not null references public.small_boat_listings(id) on delete cascade,
  place_id uuid not null references public.places(id) on delete cascade,
  primary key (listing_id, place_id)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  traveler_id uuid not null references public.profiles(id) on delete restrict,
  provider_id uuid not null references public.providers(id) on delete restrict,
  service_type public.service_type not null,
  houseboat_listing_id uuid references public.houseboat_listings(id) on delete restrict,
  small_boat_listing_id uuid references public.small_boat_listings(id) on delete restrict,
  saved_trip_id uuid references public.saved_trips(id) on delete set null,
  primary_place_id uuid references public.places(id) on delete set null,
  water_body_id uuid references public.water_bodies(id) on delete set null,
  start_date date not null,
  duration_days integer not null check (duration_days >= 1),
  traveler_count integer not null check (traveler_count >= 1),
  preferred_language text,
  note text,
  traveler_contact_consent boolean not null default false,
  status public.booking_status not null default 'PENDING',
  cancelled_by uuid references public.profiles(id) on delete set null,
  cancellation_reason text,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (service_type = 'GUIDE' and houseboat_listing_id is null and small_boat_listing_id is null)
    or (service_type = 'HOUSEBOAT' and houseboat_listing_id is not null and small_boat_listing_id is null)
    or (service_type = 'SMALL_BOAT' and houseboat_listing_id is null and small_boat_listing_id is not null)
    or (service_type in ('RESORT_HOTEL', 'CAR_TRANSPORT', 'PARKING', 'TOUR_AGENCY')
        and houseboat_listing_id is null and small_boat_listing_id is null)
  ),
  check (
    (status = 'CANCELLED' and cancelled_by is not null and cancelled_at is not null)
    or (status <> 'CANCELLED' and cancelled_by is null and cancelled_at is null)
  )
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete restrict,
  traveler_id uuid not null references public.profiles(id) on delete restrict,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  status public.review_status not null default 'PUBLISHED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  category public.report_category not null,
  details text not null,
  booking_id uuid references public.bookings(id) on delete set null,
  provider_id uuid references public.providers(id) on delete set null,
  review_id uuid references public.reviews(id) on delete set null,
  status public.report_status not null default 'OPEN',
  admin_note text,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  reason text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index places_district_idx on public.places(district_id);
create index place_relationships_from_idx on public.place_relationships(from_place_id);
create index bookings_traveler_idx on public.bookings(traveler_id, created_at desc);
create index bookings_provider_idx on public.bookings(provider_id, status, created_at desc);
create index reports_status_idx on public.reports(status, created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'districts', 'places', 'water_bodies', 'saved_trips', 'providers',
    'provider_verifications', 'provider_subscriptions', 'guide_profiles',
    'houseboat_listings', 'small_boat_listings', 'bookings', 'reviews', 'reports'
  ]
  loop
    execute format(
      'create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      table_name, table_name
    );
  end loop;
end;
$$;

create schema if not exists private;

create or replace function private.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'SUPER_ADMIN' and status = 'ACTIVE'
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
set search_path = public, private
as $$
  select private.is_super_admin();
$$;

create or replace function private.owns_provider(target_provider_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.providers
    where id = target_provider_id and user_id = auth.uid()
  );
$$;

create or replace function public.owns_provider(target_provider_id uuid)
returns boolean
language sql
stable
set search_path = public, private
as $$
  select private.owns_provider(target_provider_id);
$$;

create or replace function private.is_provider_discoverable(target_provider_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.providers p
    join public.provider_verifications v on v.provider_id = p.id and v.status = 'APPROVED'
    join public.provider_subscriptions s on s.provider_id = p.id and s.status = 'ACTIVE'
    where p.id = target_provider_id
      and p.account_status = 'ACTIVE'
      and p.public_status = 'PUBLISHED'
  );
$$;

create or replace function public.is_provider_discoverable(target_provider_id uuid)
returns boolean
language sql
stable
set search_path = public, private
as $$
  select private.is_provider_discoverable(target_provider_id);
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
begin
  case requested_role
    when 'TOUR_GUIDE' then assigned_role := 'TOUR_GUIDE'; assigned_provider_type := 'GUIDE';
    when 'HOUSEBOAT_OWNER' then assigned_role := 'HOUSEBOAT_OWNER'; assigned_provider_type := 'HOUSEBOAT_OWNER';
    when 'SMALL_BOAT_OWNER' then assigned_role := 'SMALL_BOAT_OWNER'; assigned_provider_type := 'SMALL_BOAT_OWNER';
    when 'RESORT_HOTEL_OWNER' then assigned_role := 'RESORT_HOTEL_OWNER'; assigned_provider_type := 'RESORT_HOTEL_OWNER';
    when 'CAR_TRANSPORT_OWNER' then assigned_role := 'CAR_TRANSPORT_OWNER'; assigned_provider_type := 'CAR_TRANSPORT_OWNER';
    when 'PARKING_OWNER' then assigned_role := 'PARKING_OWNER'; assigned_provider_type := 'PARKING_OWNER';
    when 'TOUR_AGENCY' then assigned_role := 'TOUR_AGENCY'; assigned_provider_type := 'TOUR_AGENCY_ORGANIZATION';
    else assigned_role := 'TRAVELER'; assigned_provider_type := null;
  end case;
  insert into public.profiles (id, role, full_name, email, phone)
  values (
    new.id, assigned_role,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    signup_phone
  ) on conflict (id) do nothing;
  if assigned_provider_type is not null then
    insert into public.providers (user_id, type, display_name, contact_email, contact_phone)
    values (new.id, assigned_provider_type, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.email, signup_phone)
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- A trusted SQL/service-role context has no end-user JWT and bootstraps the first Admin.
  if auth.uid() is not null
     and not public.is_super_admin()
     and (new.role is distinct from old.role or new.status is distinct from old.status) then
    raise exception 'Only SUPER_ADMIN may change role or account status';
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

create trigger protect_profile_privileges
before update on public.profiles
for each row execute function public.protect_profile_privileges();

create or replace function public.protect_provider_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_super_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.user_id <> auth.uid() or new.account_status <> 'PENDING' or new.public_status <> 'DRAFT' then
      raise exception 'Provider approval fields are Admin-controlled';
    end if;
  elsif new.user_id is distinct from old.user_id
     or new.type is distinct from old.type
     or new.account_status is distinct from old.account_status
     or new.public_status is distinct from old.public_status then
    raise exception 'Provider approval fields are Admin-controlled';
  end if;
  return new;
end;
$$;

create trigger protect_provider_admin_fields
before insert or update on public.providers
for each row execute function public.protect_provider_admin_fields();

create or replace function public.create_provider_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.provider_subscriptions (provider_id, provider_type)
  values (new.id, new.type);
  return new;
end;
$$;

create trigger create_provider_subscription
after insert on public.providers
for each row execute function public.create_provider_subscription();

create or replace function public.validate_subscription_provider_type()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.providers p
    where p.id = new.provider_id and p.type = new.provider_type
  ) then
    raise exception 'Subscription provider type must match provider';
  end if;
  return new;
end;
$$;

create trigger validate_subscription_provider_type
before insert or update on public.provider_subscriptions
for each row execute function public.validate_subscription_provider_type();

create or replace function public.protect_verification_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_super_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.status <> 'PENDING' or new.reviewed_by is not null or new.reviewed_at is not null
       or new.admin_note is not null or new.email_verified or new.phone_verified
       or new.identity_checked or new.service_checked then
      raise exception 'Verification review fields are Admin-controlled';
    end if;
  elsif new.status is distinct from old.status
     or new.document_path is distinct from old.document_path
     or new.reviewed_by is distinct from old.reviewed_by
     or new.reviewed_at is distinct from old.reviewed_at
     or new.admin_note is distinct from old.admin_note
     or new.email_verified is distinct from old.email_verified
     or new.phone_verified is distinct from old.phone_verified
     or new.identity_checked is distinct from old.identity_checked
     or new.service_checked is distinct from old.service_checked then
    raise exception 'Verification evidence and review fields are Admin-controlled';
  end if;
  return new;
end;
$$;

create trigger protect_verification_review
before insert or update on public.provider_verifications
for each row execute function public.protect_verification_review();

create or replace function public.protect_listing_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then
    if (tg_op = 'INSERT' and new.status <> 'DRAFT')
       or (tg_op = 'UPDATE' and new.status is distinct from old.status) then
      raise exception 'Listing publication status is Admin-controlled';
    end if;
  end if;
  return new;
end;
$$;

create trigger protect_houseboat_listing_status
before insert or update on public.houseboat_listings
for each row execute function public.protect_listing_status();
create trigger protect_small_boat_listing_status
before insert or update on public.small_boat_listings
for each row execute function public.protect_listing_status();

create or replace function public.validate_service_provider_type()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  expected_type public.provider_type := case tg_table_name
    when 'guide_profiles' then 'GUIDE'::public.provider_type
    when 'houseboat_listings' then 'HOUSEBOAT_OWNER'::public.provider_type
    when 'small_boat_listings' then 'SMALL_BOAT_OWNER'::public.provider_type
  end;
begin
  if not exists (
    select 1 from public.providers
    where id = new.provider_id and type = expected_type
  ) then
    raise exception 'Provider type does not match service record';
  end if;
  return new;
end;
$$;

create trigger validate_guide_provider_type
before insert or update on public.guide_profiles
for each row execute function public.validate_service_provider_type();
create trigger validate_houseboat_provider_type
before insert or update on public.houseboat_listings
for each row execute function public.validate_service_provider_type();
create trigger validate_small_boat_provider_type
before insert or update on public.small_boat_listings
for each row execute function public.validate_service_provider_type();

create or replace function public.validate_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actual_provider_type public.provider_type;
  listing_provider_id uuid;
  listing_water_body_id uuid;
  listing_status public.record_status;
  sundarbans boolean := false;
  admin_user boolean := public.is_super_admin();
  provider_owner boolean;
begin
  select type into actual_provider_type from public.providers where id = new.provider_id;
  if not found then
    raise exception 'Unknown provider';
  end if;

  if actual_provider_type <> (case new.service_type
    when 'GUIDE' then 'GUIDE'::public.provider_type
    when 'HOUSEBOAT' then 'HOUSEBOAT_OWNER'::public.provider_type
    when 'SMALL_BOAT' then 'SMALL_BOAT_OWNER'::public.provider_type
    when 'RESORT_HOTEL' then 'RESORT_HOTEL_OWNER'::public.provider_type
    when 'CAR_TRANSPORT' then 'CAR_TRANSPORT_OWNER'::public.provider_type
    when 'PARKING' then 'PARKING_OWNER'::public.provider_type
    when 'TOUR_AGENCY' then 'TOUR_AGENCY_ORGANIZATION'::public.provider_type
  end) then
    raise exception 'Booking service does not match provider type';
  end if;

  if new.service_type = 'GUIDE' then
    if not exists (select 1 from public.guide_profiles where provider_id = new.provider_id) then
      raise exception 'Guide profile is required';
    end if;
    new.water_body_id = null;
  elsif new.service_type = 'HOUSEBOAT' then
    select provider_id, water_body_id, status
      into listing_provider_id, listing_water_body_id, listing_status
    from public.houseboat_listings where id = new.houseboat_listing_id;
    if listing_provider_id is distinct from new.provider_id or listing_status <> 'PUBLISHED' then
      raise exception 'Houseboat listing is not bookable';
    end if;
    new.water_body_id = listing_water_body_id;
  elsif new.service_type = 'SMALL_BOAT' then
    select l.provider_id, l.water_body_id, l.status, w.is_sundarbans
      into listing_provider_id, listing_water_body_id, listing_status, sundarbans
    from public.small_boat_listings l
    join public.water_bodies w on w.id = l.water_body_id
    where l.id = new.small_boat_listing_id;
    if listing_provider_id is distinct from new.provider_id or listing_status <> 'PUBLISHED' then
      raise exception 'Small boat listing is not bookable';
    end if;
    new.water_body_id = listing_water_body_id;
    if sundarbans and new.duration_days <> 1 then
      raise exception 'Sundarbans small boat bookings must be exactly 1 day';
    end if;
  else
    new.water_body_id = null;
  end if;

  if tg_op = 'INSERT' then
    if new.status <> 'PENDING' then
      raise exception 'New bookings must be Pending';
    end if;
    if not admin_user and new.traveler_id <> auth.uid() then
      raise exception 'Traveler may only create their own booking';
    end if;
  else
    if row(new.traveler_id, new.provider_id, new.service_type,
           new.houseboat_listing_id, new.small_boat_listing_id,
           new.saved_trip_id, new.primary_place_id, new.start_date,
           new.duration_days, new.traveler_count, new.preferred_language, new.note)
       is distinct from
       row(old.traveler_id, old.provider_id, old.service_type,
           old.houseboat_listing_id, old.small_boat_listing_id,
           old.saved_trip_id, old.primary_place_id, old.start_date,
           old.duration_days, old.traveler_count, old.preferred_language, old.note) then
      raise exception 'Booking parties and terms are immutable';
    end if;

    if not admin_user then
      provider_owner = public.owns_provider(old.provider_id);
      if provider_owner then
        if new.traveler_contact_consent is distinct from old.traveler_contact_consent then
          raise exception 'Only the traveler may change contact consent';
        end if;
        if not ((old.status = 'PENDING' and new.status in ('CONFIRMED', 'CANCELLED'))
                or (old.status = 'CONFIRMED' and new.status in ('COMPLETED', 'CANCELLED'))) then
          raise exception 'Invalid provider booking transition';
        end if;
      elsif old.traveler_id = auth.uid() then
        if new.status = old.status and new.traveler_contact_consent is distinct from old.traveler_contact_consent then
          null;
        elsif new.status <> 'CANCELLED' or old.status not in ('PENDING', 'CONFIRMED') then
          raise exception 'Traveler may only cancel an active booking';
        end if;
      else
        raise exception 'Not a booking party';
      end if;
    end if;
  end if;

  if tg_op = 'INSERT' or (old.status = 'PENDING' and new.status = 'CONFIRMED') then
    if not public.is_provider_discoverable(new.provider_id) then
      raise exception 'Provider must be approved, active, published, and subscribed';
    end if;
  end if;

  if tg_op = 'UPDATE' and new.status = 'CANCELLED' and old.status <> 'CANCELLED' then
    new.cancelled_by = coalesce(new.cancelled_by, auth.uid());
    new.cancelled_at = coalesce(new.cancelled_at, now());
  elsif new.status <> 'CANCELLED' then
    new.cancelled_by = null;
    new.cancelled_at = null;
    new.cancellation_reason = null;
  end if;
  return new;
end;
$$;

create trigger validate_booking
before insert or update on public.bookings
for each row execute function public.validate_booking();

create or replace function public.validate_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  booking_traveler uuid;
  booking_state public.booking_status;
begin
  select traveler_id, status into booking_traveler, booking_state
  from public.bookings where id = new.booking_id;
  if booking_state <> 'COMPLETED' then
    raise exception 'Only completed bookings may be reviewed';
  end if;
  if not public.is_super_admin() and booking_traveler <> auth.uid() then
    raise exception 'Only the booking traveler may review';
  end if;
  new.traveler_id = booking_traveler;
  return new;
end;
$$;

create trigger validate_review
before insert on public.reviews
for each row execute function public.validate_review();

create or replace function public.booking_contacts(target_booking_id uuid)
returns table (
  traveler_name text,
  traveler_email text,
  traveler_phone text,
  provider_name text,
  provider_email text,
  provider_phone text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.bookings b
    where b.id = target_booking_id
      and b.status in ('CONFIRMED', 'COMPLETED')
      and (b.traveler_id = auth.uid() or public.owns_provider(b.provider_id) or public.is_super_admin())
  ) then
    raise exception 'Contact details unlock only for confirmed booking parties'
      using errcode = '42501';
  end if;

  return query
  select
    t.full_name,
    case when b.traveler_contact_consent or b.traveler_id = auth.uid() or public.is_super_admin()
      then t.email else null end,
    case when b.traveler_contact_consent or b.traveler_id = auth.uid() or public.is_super_admin()
      then t.phone else null end,
    p.display_name,
    p.contact_email,
    p.contact_phone
  from public.bookings b
  join public.profiles t on t.id = b.traveler_id
  join public.providers p on p.id = b.provider_id
  where b.id = target_booking_id;
end;
$$;

create or replace function public.audit_super_admin_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  previous jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  current jsonb := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
begin
  if public.is_super_admin() then
    insert into public.admin_actions (
      admin_user_id, entity_type, entity_id, action, reason, old_data, new_data
    ) values (
      auth.uid(), tg_table_name,
      coalesce(
        (current ->> 'id')::uuid, (previous ->> 'id')::uuid,
        (current ->> 'provider_id')::uuid, (previous ->> 'provider_id')::uuid
      ),
      tg_op, nullif(current_setting('app.admin_reason', true), ''), previous, current
    );
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'districts', 'places', 'place_relationships', 'water_bodies', 'saved_trips', 'providers',
    'provider_verifications', 'provider_subscriptions', 'houseboat_listings',
    'small_boat_listings', 'guide_profiles', 'bookings', 'reviews', 'reports'
  ]
  loop
    execute format(
      'create trigger audit_%I after insert or update or delete on public.%I for each row execute function public.audit_super_admin_change()',
      table_name, table_name
    );
  end loop;
end;
$$;

create or replace function private.list_public_provider_profiles()
returns table (id uuid, type public.provider_type, display_name text, bio text, photo_url text, identity_verified boolean)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.type, p.display_name, p.bio, p.photo_url, true
  from public.providers p
  where public.is_provider_discoverable(p.id);
$$;

create or replace function private.list_public_reviews()
returns table (id uuid, provider_id uuid, service_type public.service_type, houseboat_listing_id uuid, small_boat_listing_id uuid, rating smallint, comment text, created_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select r.id, b.provider_id, b.service_type, b.houseboat_listing_id,
         b.small_boat_listing_id, r.rating, r.comment, r.created_at
  from public.reviews r
  join public.bookings b on b.id = r.booking_id
  where r.status = 'PUBLISHED';
$$;

create view public.public_provider_profiles
with (security_barrier = true, security_invoker = true)
as select * from private.list_public_provider_profiles();

create view public.public_reviews
with (security_barrier = true, security_invoker = true)
as select * from private.list_public_reviews();

alter table public.profiles enable row level security;
alter table public.districts enable row level security;
alter table public.places enable row level security;
alter table public.place_aliases enable row level security;
alter table public.place_relationships enable row level security;
alter table public.water_bodies enable row level security;
alter table public.water_body_places enable row level security;
alter table public.saved_trips enable row level security;
alter table public.saved_trip_places enable row level security;
alter table public.providers enable row level security;
alter table public.provider_verifications enable row level security;
alter table public.provider_subscriptions enable row level security;
alter table public.guide_profiles enable row level security;
alter table public.guide_places enable row level security;
alter table public.houseboat_listings enable row level security;
alter table public.houseboat_places enable row level security;
alter table public.small_boat_listings enable row level security;
alter table public.small_boat_places enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews enable row level security;
alter table public.reports enable row level security;
alter table public.admin_actions enable row level security;

create policy profiles_owner_select on public.profiles for select to authenticated
using (id = auth.uid());
create policy profiles_owner_update on public.profiles for update to authenticated
using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_super_admin on public.profiles for all to authenticated
using (public.is_super_admin()) with check (public.is_super_admin());

create policy districts_public_read on public.districts for select to anon, authenticated
using (status = 'PUBLISHED');
create policy districts_super_admin on public.districts for all to authenticated
using (public.is_super_admin()) with check (public.is_super_admin());
create policy places_public_read on public.places for select to anon, authenticated
using (status = 'PUBLISHED');
create policy places_super_admin on public.places for all to authenticated
using (public.is_super_admin()) with check (public.is_super_admin());
create policy place_aliases_public_read on public.place_aliases for select to anon, authenticated
using (exists (select 1 from public.places p where p.id = place_id and p.status = 'PUBLISHED'));
create policy place_aliases_super_admin on public.place_aliases for all to authenticated
using (public.is_super_admin()) with check (public.is_super_admin());
create policy place_relationships_public_read on public.place_relationships for select to anon, authenticated
using (
  exists (select 1 from public.places p where p.id = from_place_id and p.status = 'PUBLISHED')
  and exists (select 1 from public.places p where p.id = to_place_id and p.status = 'PUBLISHED')
);
create policy place_relationships_super_admin on public.place_relationships for all to authenticated
using (public.is_super_admin()) with check (public.is_super_admin());
create policy water_bodies_public_read on public.water_bodies for select to anon, authenticated
using (status = 'PUBLISHED');
create policy water_bodies_super_admin on public.water_bodies for all to authenticated
using (public.is_super_admin()) with check (public.is_super_admin());
create policy water_body_places_public_read on public.water_body_places for select to anon, authenticated
using (
  exists (select 1 from public.water_bodies w where w.id = water_body_id and w.status = 'PUBLISHED')
  and exists (select 1 from public.places p where p.id = place_id and p.status = 'PUBLISHED')
);
create policy water_body_places_super_admin on public.water_body_places for all to authenticated
using (public.is_super_admin()) with check (public.is_super_admin());

create policy saved_trips_owner on public.saved_trips for all to authenticated
using (traveler_id = auth.uid()) with check (traveler_id = auth.uid());
create policy saved_trips_super_admin on public.saved_trips for all to authenticated
using (public.is_super_admin()) with check (public.is_super_admin());
create policy saved_trip_places_owner on public.saved_trip_places for all to authenticated
using (exists (select 1 from public.saved_trips t where t.id = saved_trip_id and t.traveler_id = auth.uid()))
with check (exists (select 1 from public.saved_trips t where t.id = saved_trip_id and t.traveler_id = auth.uid()));
create policy saved_trip_places_super_admin on public.saved_trip_places for all to authenticated
using (public.is_super_admin()) with check (public.is_super_admin());

create policy providers_owner_select on public.providers for select to authenticated
using (user_id = auth.uid());
create policy providers_owner_insert on public.providers for insert to authenticated
with check (
  user_id = auth.uid() and (
    (type = 'GUIDE' and exists (select 1 from public.profiles where id = auth.uid() and role = 'TOUR_GUIDE'))
    or (type = 'HOUSEBOAT_OWNER' and exists (select 1 from public.profiles where id = auth.uid() and role = 'HOUSEBOAT_OWNER'))
    or (type = 'SMALL_BOAT_OWNER' and exists (select 1 from public.profiles where id = auth.uid() and role = 'SMALL_BOAT_OWNER'))
    or (type = 'RESORT_HOTEL_OWNER' and exists (select 1 from public.profiles where id = auth.uid() and role = 'RESORT_HOTEL_OWNER'))
    or (type = 'CAR_TRANSPORT_OWNER' and exists (select 1 from public.profiles where id = auth.uid() and role = 'CAR_TRANSPORT_OWNER'))
    or (type = 'PARKING_OWNER' and exists (select 1 from public.profiles where id = auth.uid() and role = 'PARKING_OWNER'))
    or (type = 'TOUR_AGENCY_ORGANIZATION' and exists (select 1 from public.profiles where id = auth.uid() and role = 'TOUR_AGENCY'))
  )
);
create policy providers_owner_update on public.providers for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy providers_super_admin on public.providers for all to authenticated
using (public.is_super_admin()) with check (public.is_super_admin());

create policy verifications_owner_select on public.provider_verifications for select to authenticated
using (public.owns_provider(provider_id));
create policy verifications_owner_insert on public.provider_verifications for insert to authenticated
with check (public.owns_provider(provider_id));
create policy verifications_owner_update on public.provider_verifications for update to authenticated
using (public.owns_provider(provider_id)) with check (public.owns_provider(provider_id));
create policy verifications_super_admin on public.provider_verifications for all to authenticated
using (public.is_super_admin()) with check (public.is_super_admin());

create policy subscriptions_owner_read on public.provider_subscriptions for select to authenticated
using (public.owns_provider(provider_id));
create policy subscriptions_super_admin on public.provider_subscriptions for all to authenticated
using (public.is_super_admin()) with check (public.is_super_admin());

create policy guide_profiles_public_read on public.guide_profiles for select to anon, authenticated
using (public.is_provider_discoverable(provider_id));
create policy guide_profiles_owner on public.guide_profiles for all to authenticated
using (public.owns_provider(provider_id)) with check (public.owns_provider(provider_id));
create policy guide_profiles_super_admin on public.guide_profiles for all to authenticated
using (public.is_super_admin()) with check (public.is_super_admin());
create policy guide_places_public_read on public.guide_places for select to anon, authenticated
using (public.is_provider_discoverable(provider_id));
create policy guide_places_owner on public.guide_places for all to authenticated
using (public.owns_provider(provider_id)) with check (public.owns_provider(provider_id));
create policy guide_places_super_admin on public.guide_places for all to authenticated
using (public.is_super_admin()) with check (public.is_super_admin());

create policy houseboats_public_read on public.houseboat_listings for select to anon, authenticated
using (status = 'PUBLISHED' and public.is_provider_discoverable(provider_id));
create policy houseboats_owner on public.houseboat_listings for all to authenticated
using (public.owns_provider(provider_id)) with check (public.owns_provider(provider_id));
create policy houseboats_super_admin on public.houseboat_listings for all to authenticated
using (public.is_super_admin()) with check (public.is_super_admin());
create policy houseboat_places_public_read on public.houseboat_places for select to anon, authenticated
using (exists (
  select 1 from public.houseboat_listings l
  where l.id = listing_id and l.status = 'PUBLISHED' and public.is_provider_discoverable(l.provider_id)
));
create policy houseboat_places_owner on public.houseboat_places for all to authenticated
using (exists (select 1 from public.houseboat_listings l where l.id = listing_id and public.owns_provider(l.provider_id)))
with check (exists (select 1 from public.houseboat_listings l where l.id = listing_id and public.owns_provider(l.provider_id)));
create policy houseboat_places_super_admin on public.houseboat_places for all to authenticated
using (public.is_super_admin()) with check (public.is_super_admin());

create policy small_boats_public_read on public.small_boat_listings for select to anon, authenticated
using (status = 'PUBLISHED' and public.is_provider_discoverable(provider_id));
create policy small_boats_owner on public.small_boat_listings for all to authenticated
using (public.owns_provider(provider_id)) with check (public.owns_provider(provider_id));
create policy small_boats_super_admin on public.small_boat_listings for all to authenticated
using (public.is_super_admin()) with check (public.is_super_admin());
create policy small_boat_places_public_read on public.small_boat_places for select to anon, authenticated
using (exists (
  select 1 from public.small_boat_listings l
  where l.id = listing_id and l.status = 'PUBLISHED' and public.is_provider_discoverable(l.provider_id)
));
create policy small_boat_places_owner on public.small_boat_places for all to authenticated
using (exists (select 1 from public.small_boat_listings l where l.id = listing_id and public.owns_provider(l.provider_id)))
with check (exists (select 1 from public.small_boat_listings l where l.id = listing_id and public.owns_provider(l.provider_id)));
create policy small_boat_places_super_admin on public.small_boat_places for all to authenticated
using (public.is_super_admin()) with check (public.is_super_admin());

create policy bookings_traveler_select on public.bookings for select to authenticated
using (traveler_id = auth.uid());
create policy bookings_traveler_insert on public.bookings for insert to authenticated
with check (traveler_id = auth.uid());
create policy bookings_traveler_update on public.bookings for update to authenticated
using (traveler_id = auth.uid()) with check (traveler_id = auth.uid());
create policy bookings_provider_select on public.bookings for select to authenticated
using (public.owns_provider(provider_id));
create policy bookings_provider_update on public.bookings for update to authenticated
using (public.owns_provider(provider_id)) with check (public.owns_provider(provider_id));
create policy bookings_super_admin on public.bookings for all to authenticated
using (public.is_super_admin()) with check (public.is_super_admin());

create policy reviews_traveler_select on public.reviews for select to authenticated
using (traveler_id = auth.uid());
create policy reviews_traveler_insert on public.reviews for insert to authenticated
with check (traveler_id = auth.uid());
create policy reviews_provider_select on public.reviews for select to authenticated
using (exists (
  select 1 from public.bookings b
  where b.id = booking_id and public.owns_provider(b.provider_id)
));
create policy reviews_super_admin on public.reviews for all to authenticated
using (public.is_super_admin()) with check (public.is_super_admin());

create policy reports_owner_select on public.reports for select to authenticated
using (created_by = auth.uid());
create policy reports_owner_insert on public.reports for insert to authenticated
with check (created_by = auth.uid() and status = 'OPEN' and admin_note is null and resolved_by is null);
create policy reports_super_admin on public.reports for all to authenticated
using (public.is_super_admin()) with check (public.is_super_admin());

create policy admin_actions_super_admin_select on public.admin_actions for select to authenticated
using (public.is_super_admin());
create policy admin_actions_super_admin_insert on public.admin_actions for insert to authenticated
with check (public.is_super_admin() and admin_user_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('provider-verifications-private', 'provider-verifications-private', false)
on conflict (id) do update set public = false;

create policy verification_files_owner_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'provider-verifications-private'
  and (storage.foldername(name))[1] = auth.uid()::text
);
create policy verification_files_super_admin on storage.objects for all to authenticated
using (bucket_id = 'provider-verifications-private' and public.is_super_admin())
with check (bucket_id = 'provider-verifications-private' and public.is_super_admin());

revoke all on function public.booking_contacts(uuid) from public, anon, authenticated;
revoke execute on function public.protect_verification_review() from public, anon, authenticated;
revoke execute on function public.audit_super_admin_change() from public, anon, authenticated;
revoke execute on function public.create_provider_subscription() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.protect_listing_status() from public, anon, authenticated;
revoke execute on function public.validate_service_provider_type() from public, anon, authenticated;
revoke execute on function public.protect_profile_privileges() from public, anon, authenticated;
revoke execute on function public.protect_provider_admin_fields() from public, anon, authenticated;
revoke execute on function public.validate_subscription_provider_type() from public, anon, authenticated;
revoke execute on function public.validate_review() from public, anon, authenticated;
revoke execute on function public.validate_booking() from public, anon, authenticated;
grant usage on schema private to anon, authenticated;
revoke all on function private.is_super_admin() from public;
grant execute on function private.is_super_admin() to anon, authenticated;
grant execute on function public.is_super_admin() to anon, authenticated;
revoke all on function private.owns_provider(uuid) from public;
revoke all on function public.owns_provider(uuid) from public, anon;
grant execute on function private.owns_provider(uuid) to authenticated;
grant execute on function public.owns_provider(uuid) to authenticated;
revoke all on function private.is_provider_discoverable(uuid) from public;
grant execute on function private.is_provider_discoverable(uuid) to anon, authenticated;
grant execute on function public.is_provider_discoverable(uuid) to anon, authenticated;
revoke all on function private.list_public_provider_profiles() from public;
revoke all on function private.list_public_reviews() from public;
grant execute on function private.list_public_provider_profiles() to anon, authenticated;
grant execute on function private.list_public_reviews() to anon, authenticated;
grant select on public.public_provider_profiles, public.public_reviews to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

comment on table public.provider_verifications is 'Private identity verification data; never expose through public views.';
comment on function public.booking_contacts(uuid) is 'Returns booking-party contact only after confirmation.';
comment on table public.provider_subscriptions is 'Freezing blocks new business; it never mutates or cancels existing bookings.';
