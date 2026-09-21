with seeded_districts as (
  insert into public.districts (name, division, slug, district_code, display_order, status)
  values
    ('Rangpur', 'Rangpur', 'rangpur', 'rangpur', 23, 'PUBLISHED'),
    ('Dinajpur', 'Rangpur', 'dinajpur', 'dinajpur', 24, 'PUBLISHED'),
    ('Panchagarh', 'Rangpur', 'panchagarh', 'panchagarh', 25, 'PUBLISHED'),
    ('Thakurgaon', 'Rangpur', 'thakurgaon', 'thakurgaon', 26, 'PUBLISHED'),
    ('Nilphamari', 'Rangpur', 'nilphamari', 'nilphamari', 27, 'PUBLISHED'),
    ('Lalmonirhat', 'Rangpur', 'lalmonirhat', 'lalmonirhat', 28, 'PUBLISHED'),
    ('Kurigram', 'Rangpur', 'kurigram', 'kurigram', 29, 'PUBLISHED'),
    ('Gaibandha', 'Rangpur', 'gaibandha', 'gaibandha', 30, 'PUBLISHED')
  on conflict (slug) do update set name = excluded.name, division = excluded.division, district_code = excluded.district_code, display_order = excluded.display_order, status = excluded.status
  returning id, slug, name
), source(district_slug, names) as (
  values
    ('rangpur', 'Tajhat Palace|Begum Rokeya Memorial, Pairaband|Carmichael College|Rangpur Zoo|Town Hall|Ghaghat River|Keramotia Mosque'),
    ('dinajpur', 'Kantajew Temple|Ramsagar National Park|Nayabad Mosque|Dinajpur Rajbari|Swapnapuri|Sitakot Vihara|Dhepa River|Hili area'),
    ('panchagarh', 'Tetulia|Kanchenjunga viewpoint|Banglabandha Zero Point|Tea Gardens|Rocks Museum|Bhitargarh Archaeological Site|Maharaja Dighi|Karatoya River|Tetulia Dak Bungalow area'),
    ('thakurgaon', 'Haripur Rajbari|Tangon Barrage|Nekmarad archaeological area|Ranishankail Zamindar Bari|Kulik/Tangon river areas|Ancient temples and zamindar sites'),
    ('nilphamari', 'Nilsagar|Chini Mosque, Saidpur|Saidpur Railway Workshop|Teesta Barrage/Dalia area|Saidpur historic town|Teesta River'),
    ('lalmonirhat', 'Teesta Barrage area|Kakina Zamindar Bari|Tushbhandar Zamindar Bari|Burimari Land Port|Teesta Railway Bridge|Tin Bigha Corridor area'),
    ('kurigram', 'Chilmari River Port|Brahmaputra River|Dharla Bridge|Sonahat Land Port|River islands/chars|Chandamari Mosque|Liberation War memorial sites'),
    ('gaibandha', 'Friendship Centre|Balashi Ghat|Brahmaputra/Jamuna riverfront|Bardhan Kuthi|Naldanga Zamindar heritage|Vobaniganj historic areas|River chars')
), listed_places as (
  select source.district_slug, trim(name) as name
  from source cross join lateral unnest(string_to_array(source.names, '|')) as name
)
insert into public.places (district_id, name, slug, upazila_or_area, category, short_description, best_time, how_to_reach, practical_tips, status)
select district.id, place.name,
  trim(both '-' from regexp_replace(lower(place.name), '[^a-z0-9]+', '-', 'g')),
  district.name,
  case
    when place.name ilike '%River%' or place.name ilike '%river%' or place.name ilike '%Ghat%' or place.name ilike '%Port%' or place.name ilike '%Bridge%' or place.name ilike '%Barrage%' then 'Riverfront and waterway'
    when place.name ilike '%Park%' or place.name ilike '%Zoo%' or place.name ilike '%Safari%' then 'Park and nature'
    when place.name ilike '%Mosque%' or place.name ilike '%Temple%' or place.name ilike '%Church%' then 'Religious and historic site'
    when place.name ilike '%Palace%' or place.name ilike '%Rajbari%' or place.name ilike '%Bari%' or place.name ilike '%Archaeological%' or place.name ilike '%Vihara%' or place.name ilike '%Memorial%' then 'Historic site'
    else 'Tourist place'
  end,
  format('%s is a listed visitor destination in %s.', place.name, district.name),
  'November to March',
  'Use available local transport and confirm the final approach locally.',
  'Check current access, weather, and opening information before visiting.',
  'PUBLISHED'
from seeded_districts district
join listed_places place on place.district_slug = district.slug
on conflict (district_id, slug) do update set name = excluded.name, upazila_or_area = excluded.upazila_or_area, category = excluded.category, short_description = excluded.short_description, best_time = excluded.best_time, how_to_reach = excluded.how_to_reach, practical_tips = excluded.practical_tips, status = excluded.status;
