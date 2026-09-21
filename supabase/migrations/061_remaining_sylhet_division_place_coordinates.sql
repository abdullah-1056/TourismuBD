update public.places as place
set
  latitude = verified.latitude,
  longitude = verified.longitude,
  updated_at = now()
from public.districts as district
join (
  values
    ('moulvibazar', 'sreemangal', 24.309864::numeric, 91.730873::numeric),
    ('moulvibazar', 'lawachara-national-park', 24.329227::numeric, 91.787934::numeric),
    ('moulvibazar', 'madhabkunda-waterfall', 24.639170::numeric, 92.221110::numeric),
    ('moulvibazar', 'madhabpur-lake', 24.281044::numeric, 91.817327::numeric),
    ('moulvibazar', 'baikka-beel', 24.350199::numeric, 91.699309::numeric),
    ('moulvibazar', 'ham-ham-waterfall', 24.167972::numeric, 91.912528::numeric),
    ('moulvibazar', 'hakaluki-haor', 24.636177::numeric, 92.064193::numeric),
    ('moulvibazar', 'moulvibazar-tea-gardens', 24.484307::numeric, 91.768528::numeric),
    ('moulvibazar', 'manipuri-villages', 24.373688::numeric, 91.749959::numeric),
    ('moulvibazar', 'adampur-forest', 24.262800::numeric, 91.912770::numeric),
    ('moulvibazar', 'madhabpur-tea-estate', 24.276700::numeric, 91.817100::numeric),
    ('habiganj', 'satchari-national-park', 24.117526::numeric, 91.454443::numeric),
    ('habiganj', 'rema-kalenga-wildlife-sanctuary', 24.181383::numeric, 91.637019::numeric),
    ('habiganj', 'teliapara-memorial', 24.113933::numeric, 91.388725::numeric),
    ('habiganj', 'bithangal-akhra', 24.444211::numeric, 91.244855::numeric),
    ('habiganj', 'baniachang', 24.518632::numeric, 91.357873::numeric),
    ('habiganj', 'habiganj-tea-gardens', 24.142580::numeric, 91.507460::numeric),
    ('habiganj', 'khowai-river', 24.368100::numeric, 91.427700::numeric),
    ('sunamganj', 'tanguar-haor', 25.148387::numeric, 91.054919::numeric),
    ('sunamganj', 'niladri-lake', 25.195972::numeric, 91.174028::numeric),
    ('sunamganj', 'jadukata-river', 25.150479::numeric, 91.257539::numeric),
    ('sunamganj', 'shimul-bagan', 25.177944::numeric, 91.247610::numeric),
    ('sunamganj', 'barikka-tila', 25.188500::numeric, 91.250700::numeric),
    ('sunamganj', 'tekerghat', 25.198980::numeric, 91.190277::numeric),
    ('sunamganj', 'hason-raja-museum', 25.071053::numeric, 91.392639::numeric),
    ('sunamganj', 'lakma-chhara', 25.196802::numeric, 91.159208::numeric),
    ('sunamganj', 'meghalaya-foothill-viewpoints', 25.184850::numeric, 91.260837::numeric)
) as verified(district_slug, place_slug, latitude, longitude) on verified.district_slug = district.slug
where place.district_id = district.id
  and place.slug = verified.place_slug;
