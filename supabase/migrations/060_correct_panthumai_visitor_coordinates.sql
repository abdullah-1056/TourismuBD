update public.places as place
set
  latitude = 25.1760963,
  longitude = 91.9566475,
  updated_at = now()
from public.districts as district
where place.district_id = district.id
  and district.slug = 'sylhet'
  and place.slug = 'panthumai';
