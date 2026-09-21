create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  business_name text not null check (char_length(trim(business_name)) between 2 and 120),
  description text,
  district text,
  contact_email text,
  contact_phone text,
  account_status public.account_status not null default 'ACTIVE',
  public_status public.record_status not null default 'PUBLISHED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 140),
  description text,
  price_bdt numeric(12, 2) not null check (price_bdt >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  image_url text,
  status public.record_status not null default 'PUBLISHED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index businesses_user_idx on public.businesses(user_id);
create index business_products_business_idx on public.business_products(business_id, created_at desc);
create index business_products_public_idx on public.business_products(status, created_at desc);

create trigger set_businesses_updated_at
before update on public.businesses
for each row execute function public.set_updated_at();

create trigger set_business_products_updated_at
before update on public.business_products
for each row execute function public.set_updated_at();

create or replace function public.protect_business_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_super_admin() then
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

create trigger protect_business_admin_fields
before update on public.businesses
for each row execute function public.protect_business_admin_fields();

create trigger audit_businesses
after insert or update or delete on public.businesses
for each row execute function public.audit_super_admin_change();

create trigger audit_business_products
after insert or update or delete on public.business_products
for each row execute function public.audit_super_admin_change();

alter table public.businesses enable row level security;
alter table public.business_products enable row level security;

create policy businesses_public_read on public.businesses for select to anon, authenticated
using (account_status = 'ACTIVE' and public_status = 'PUBLISHED');
create policy businesses_owner_read on public.businesses for select to authenticated
using (user_id = auth.uid());
create policy businesses_owner_insert on public.businesses for insert to authenticated
with check (user_id = auth.uid() and account_status = 'ACTIVE' and public_status = 'PUBLISHED' and exists (
  select 1 from public.profiles where id = auth.uid() and role = 'BUSINESS_OWNER'
));
create policy businesses_owner_update on public.businesses for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy businesses_super_admin on public.businesses for all to authenticated
using (public.is_super_admin()) with check (public.is_super_admin());

create policy business_products_public_read on public.business_products for select to anon, authenticated
using (
  status = 'PUBLISHED' and exists (
    select 1 from public.businesses b
    where b.id = business_id and b.account_status = 'ACTIVE' and b.public_status = 'PUBLISHED'
  )
);
create policy business_products_owner_manage on public.business_products for all to authenticated
using (exists (
  select 1 from public.businesses b where b.id = business_id and b.user_id = auth.uid()
))
with check (exists (
  select 1 from public.businesses b where b.id = business_id and b.user_id = auth.uid()
));
create policy business_products_super_admin on public.business_products for all to authenticated
using (public.is_super_admin()) with check (public.is_super_admin());

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
    when 'BUSINESS_OWNER' then assigned_role := 'BUSINESS_OWNER'; assigned_provider_type := null;
    else assigned_role := 'TRAVELER'; assigned_provider_type := null;
  end case;

  insert into public.profiles (id, role, full_name, email, phone)
  values (new.id, assigned_role, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.email, signup_phone)
  on conflict (id) do nothing;

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

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.protect_business_admin_fields() from public, anon, authenticated;

grant select on public.businesses, public.business_products to anon, authenticated;
grant insert, update, delete on public.businesses, public.business_products to authenticated;
