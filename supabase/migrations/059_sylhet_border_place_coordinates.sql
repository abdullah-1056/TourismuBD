update public.places as place
set
  latitude = verified.latitude,
  longitude = verified.longitude,
  updated_at = now()
from public.districts as district
join (
  values
    ('tamabil', 25.181360::numeric, 92.034444::numeric),
    ('utma-chhara', 25.174950::numeric, 91.822324::numeric)
) as verified(slug, latitude, longitude) on true
where place.district_id = district.id
  and district.slug = 'sylhet'
  and place.slug = verified.slug;
