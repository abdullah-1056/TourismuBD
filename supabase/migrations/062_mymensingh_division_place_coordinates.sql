update public.places as place
set
  latitude = verified.latitude,
  longitude = verified.longitude,
  updated_at = now()
from public.districts as district
join (
  values
    ('mymensingh', 'silver-palace', 24.779047::numeric, 90.365098::numeric),
    ('jamalpur', 'lauchapra-picnic-spot', 25.283080::numeric, 89.920496::numeric),
    ('jamalpur', 'hazrat-shah-jamal-shrine', 24.940134::numeric, 89.936200::numeric),
    ('jamalpur', 'doyamoyee-temple', 24.923084::numeric, 89.949879::numeric),
    ('jamalpur', 'jamuna-river-jamalpur', 25.165520::numeric, 89.734328::numeric),
    ('jamalpur', 'brahmaputra-river-jamalpur', 24.923599::numeric, 89.967901::numeric),
    ('jamalpur', 'gandhi-ashram-heritage-sites', 24.862832::numeric, 89.866369::numeric),
    ('jamalpur', 'bakshiganj-hill-border-countryside', 25.183062::numeric, 89.870147::numeric),
    ('netrokona', 'birishiri', 25.113829::numeric, 90.673683::numeric),
    ('netrokona', 'susang-durgapur', 25.124430::numeric, 90.677997::numeric),
    ('netrokona', 'someshwari-river', 25.115682::numeric, 90.668761::numeric),
    ('netrokona', 'bijoypur-china-clay-hills', 25.157581::numeric, 90.642483::numeric),
    ('netrokona', 'garo-hills-netrokona', 25.160469::numeric, 90.693823::numeric),
    ('netrokona', 'kamala-rani-dighi', 25.107112::numeric, 90.678502::numeric),
    ('netrokona', 'susang-zamindar-palace-ruins', 25.127522::numeric, 90.678473::numeric),
    ('netrokona', 'durgapur-cultural-academy', 25.108091::numeric, 90.669891::numeric),
    ('netrokona', 'netrokona-haor-areas', 24.822391::numeric, 91.040468::numeric),
    ('sherpur', 'gajni-abakash', 25.245991::numeric, 90.045781::numeric),
    ('sherpur', 'madhutila-eco-park', 25.206154::numeric, 90.155077::numeric),
    ('sherpur', 'panihata-tarani-hills', 25.197439::numeric, 90.253126::numeric),
    ('sherpur', 'raja-pahar', 25.256543::numeric, 89.941963::numeric),
    ('sherpur', 'nalitabari-hills', 25.201489::numeric, 90.187038::numeric),
    ('sherpur', 'garo-hills-sherpur', 25.239924::numeric, 90.053596::numeric),
    ('sherpur', 'sherpur-border-viewpoints', 25.199844::numeric, 90.223357::numeric),
    ('sherpur', 'maharashi-river-area', 25.183014::numeric, 90.069109::numeric)
) as verified(district_slug, slug, latitude, longitude) on verified.district_slug = district.slug
where place.district_id = district.id
  and place.slug = verified.slug;
