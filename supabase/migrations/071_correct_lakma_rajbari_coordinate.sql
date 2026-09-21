-- Keep the border-adjacent Lakma Rajbari pin on its Bangladesh-side road approach.
update public.places as place
set latitude = 25.2050000,
    longitude = 88.9500000,
    updated_at = now()
from public.districts as district
where place.district_id = district.id
  and district.slug = 'joypurhat'
  and place.slug = 'lakma-rajbari';
