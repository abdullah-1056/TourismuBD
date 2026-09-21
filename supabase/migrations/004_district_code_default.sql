create or replace function public.fill_district_code()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.district_code is null or new.district_code = '' then new.district_code = new.slug; end if;
  return new;
end;
$$;

drop trigger if exists districts_fill_district_code on public.districts;
create trigger districts_fill_district_code
before insert or update of slug, district_code on public.districts
for each row execute function public.fill_district_code();
