-- Both published spellings identify the same Kishoreganj Haor Road visitor pin.
-- Mainland departures and seasonal boat/ferry notes are maintained in app data.
begin;

update public.places as place
set latitude = 24.395635,
    longitude = 91.006828,
    updated_at = now()
from public.districts as district
where place.district_id = district.id
  and district.slug = 'kishoreganj'
  and place.slug in ('president-abdul-hamid-haor-road', 'president-abdul-hamid-road-haor-road');

commit;
