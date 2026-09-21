alter table public.profiles add column if not exists phone_visible boolean not null default false;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := upper(coalesce(new.raw_user_meta_data ->> 'role', 'TRAVELER'));
begin
  insert into public.profiles (id, role, full_name, email, phone)
  values (
    new.id,
    case requested_role
      when 'TOUR_GUIDE' then 'TOUR_GUIDE'::public.app_role
      when 'HOUSEBOAT_OWNER' then 'HOUSEBOAT_OWNER'::public.app_role
      when 'SMALL_BOAT_OWNER' then 'SMALL_BOAT_OWNER'::public.app_role
      when 'RESORT_HOTEL_OWNER' then 'RESORT_HOTEL_OWNER'::public.app_role
      when 'CAR_TRANSPORT_OWNER' then 'CAR_TRANSPORT_OWNER'::public.app_role
      when 'PARKING_OWNER' then 'PARKING_OWNER'::public.app_role
      when 'TOUR_AGENCY' then 'TOUR_AGENCY'::public.app_role
      else 'TRAVELER'::public.app_role
    end,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.email,
    nullif(new.raw_user_meta_data ->> 'phone', '')
  ) on conflict (id) do nothing;
  return new;
end;
$$;
