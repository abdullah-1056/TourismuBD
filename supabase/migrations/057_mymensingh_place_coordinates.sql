update public.places as place
set
  latitude = verified.latitude,
  longitude = verified.longitude,
  updated_at = now()
from public.districts as district
join (
  values
    ('alexander-castle', 24.765728::numeric, 90.402058::numeric),
    ('bangladesh-agricultural-university-campus', 24.723167::numeric, 90.430320::numeric),
    ('bipin-park', 24.760700::numeric, 90.410200::numeric),
    ('mymensingh-botanical-garden', 24.724468::numeric, 90.441184::numeric),
    ('mymensingh-brahmaputra-riverfront', 24.769850::numeric, 90.397676::numeric),
    ('muktagacha-zamindar-bari', 24.769300::numeric, 90.255100::numeric),
    ('shashi-lodge', 24.761846::numeric, 90.403000::numeric),
    ('zainul-abedin-museum', 24.770300::numeric, 90.395100::numeric)
) as verified(slug, latitude, longitude) on true
where place.district_id = district.id
  and district.slug = 'mymensingh'
  and place.slug = verified.slug;
