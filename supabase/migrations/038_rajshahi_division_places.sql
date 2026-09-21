with seeded_districts as (
  insert into public.districts (name, division, slug, district_code, display_order, status)
  values
    ('Rajshahi', 'Rajshahi', 'rajshahi', 'rajshahi', 37, 'PUBLISHED'),
    ('Bogura', 'Rajshahi', 'bogura', 'bogura', 38, 'PUBLISHED'),
    ('Naogaon', 'Rajshahi', 'naogaon', 'naogaon', 39, 'PUBLISHED'),
    ('Natore', 'Rajshahi', 'natore', 'natore', 40, 'PUBLISHED'),
    ('Chapainawabganj', 'Rajshahi', 'chapainawabganj', 'chapainawabganj', 41, 'PUBLISHED'),
    ('Pabna', 'Rajshahi', 'pabna', 'pabna', 42, 'PUBLISHED'),
    ('Sirajganj', 'Rajshahi', 'sirajganj', 'sirajganj', 43, 'PUBLISHED'),
    ('Joypurhat', 'Rajshahi', 'joypurhat', 'joypurhat', 44, 'PUBLISHED')
  on conflict (slug) do update set name = excluded.name, division = excluded.division, district_code = excluded.district_code, display_order = excluded.display_order, status = excluded.status
  returning id, slug, name
), source(district_slug, names) as (
  values
    ('rajshahi', 'Puthia Temple Complex|Puthia Rajbari|Varendra Research Museum|Bagha Mosque|Padma Riverfront|T-Band|Rajshahi University campus|Shah Makhdum Shrine|Charghat river area|Mango orchards'),
    ('bogura', 'Mahasthangarh|Gokul Medh|Vasu Vihara|Mahasthan Archaeological Museum|Govinda Bhita|Khodar Pathar Bhita|Parshuram Palace site|Karatoya River'),
    ('naogaon', 'Somapura Mahavihara, Paharpur|Paharpur Museum|Kusumba Mosque|Jagaddala Mahavihara|Altadighi National Park|Dubalhati Rajbari|Balihar Rajbari'),
    ('natore', 'Natore Rajbari|Rani Bhabani Palace|Uttara Ganabhaban|Chalan Beel|Dayarampur Rajbari|Halti Beel|Dighapatia Rajbari'),
    ('chapainawabganj', 'Choto Sona Mosque|Tahkhana Complex|Darasbari Mosque|Darasbari Madrasa|Khania Dighi Mosque|Shah Niamatullah Shrine|Kotwali Darwaza|Mango orchards|Mahananda River'),
    ('pabna', 'Hardinge Bridge|Lalon Shah Bridge|Pakshi|Jor Bangla Temple|Hemayetpur Satsang Ashram|Chalan Beel|Padma River|Pakshi Railway heritage area'),
    ('sirajganj', 'Rabindranath Tagore Kacharibari, Shahjadpur|Hatikumrul Navaratna Temple|Jamuna River|Bangabandhu Bridge riverfront|Chalan Beel|Shahjadpur heritage area'),
    ('joypurhat', 'Lakma Rajbari|Achranga Dighi|Nandail Dighi|Hinda-Kasba Shahi Mosque|Pagla Dewan Killing Field/Memorial|Panchbibi historical area')
), listed_places as (
  select source.district_slug, trim(name) as name from source cross join lateral unnest(string_to_array(source.names, '|')) as name
)
insert into public.places (district_id, name, slug, upazila_or_area, category, short_description, best_time, how_to_reach, practical_tips, status)
select district.id, place.name, trim(both '-' from regexp_replace(lower(place.name), '[^a-z0-9]+', '-', 'g')), district.name,
  case when place.name ilike '%River%' or place.name ilike '%river%' or place.name ilike '%Beel%' or place.name ilike '%Band%' or place.name ilike '%Bridge%' then 'Riverfront and waterway'
       when place.name ilike '%Mosque%' or place.name ilike '%Temple%' or place.name ilike '%Shrine%' then 'Religious and historic site'
       when place.name ilike '%Rajbari%' or place.name ilike '%Palace%' or place.name ilike '%Archaeological%' or place.name ilike '%Mahavihara%' or place.name ilike '%Museum%' or place.name ilike '%heritage%' or place.name ilike '%Memorial%' then 'Historic site'
       when place.name ilike '%Park%' then 'Park and nature' else 'Tourist place' end,
  format('%s is a listed visitor destination in %s.', place.name, district.name), 'November to March', 'Use available local transport and confirm the final approach locally.', 'Check current access, weather, and opening information before visiting.', 'PUBLISHED'
from seeded_districts district join listed_places place on place.district_slug = district.slug
on conflict (district_id, slug) do update set name = excluded.name, upazila_or_area = excluded.upazila_or_area, category = excluded.category, short_description = excluded.short_description, best_time = excluded.best_time, how_to_reach = excluded.how_to_reach, practical_tips = excluded.practical_tips, status = excluded.status;
