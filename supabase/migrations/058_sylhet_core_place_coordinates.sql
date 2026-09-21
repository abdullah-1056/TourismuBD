update public.places as place
set
  latitude = verified.latitude,
  longitude = verified.longitude,
  updated_at = now()
from public.districts as district
join (
  values
    ('bichanakandi', 25.171000::numeric, 91.887000::numeric),
    ('hazrat-shah-jalal-dargah', 24.899000::numeric, 91.868000::numeric),
    ('hazrat-shah-paran-dargah', 24.897000::numeric, 91.933000::numeric),
    ('jaflong', 25.166000::numeric, 92.017000::numeric),
    ('khadimnagar-national-park', 24.964000::numeric, 91.998000::numeric),
    ('lakkatura-tea-garden', 24.933000::numeric, 91.883000::numeric),
    ('lalakhal', 25.105000::numeric, 92.171000::numeric),
    ('malnichhara-tea-estate', 24.921000::numeric, 91.856000::numeric),
    ('panthumai', 25.190000::numeric, 91.790000::numeric),
    ('ratargul-swamp-forest', 25.001000::numeric, 91.978000::numeric)
) as verified(slug, latitude, longitude) on true
where place.district_id = district.id
  and district.slug = 'sylhet'
  and place.slug = verified.slug;
