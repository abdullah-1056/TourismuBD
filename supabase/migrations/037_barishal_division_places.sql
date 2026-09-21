with seeded_districts as (
  insert into public.districts (name, division, slug, district_code, display_order, status)
  values
    ('Barishal', 'Barishal', 'barishal', 'barishal', 31, 'PUBLISHED'),
    ('Patuakhali', 'Barishal', 'patuakhali', 'patuakhali', 32, 'PUBLISHED'),
    ('Bhola', 'Barishal', 'bhola', 'bhola', 33, 'PUBLISHED'),
    ('Jhalokathi', 'Barishal', 'jhalokathi', 'jhalokathi', 34, 'PUBLISHED'),
    ('Pirojpur', 'Barishal', 'pirojpur', 'pirojpur', 35, 'PUBLISHED'),
    ('Barguna', 'Barishal', 'barguna', 'barguna', 36, 'PUBLISHED')
  on conflict (slug) do update set name = excluded.name, division = excluded.division, district_code = excluded.district_code, display_order = excluded.display_order, status = excluded.status
  returning id, slug, name
), source(district_slug, names) as (
  values
    ('barishal', 'Oxford Mission Church|Durga Sagar|Satla Water Lily Beel|Guthia/Baitul Aman Jame Mosque|Korapur Mia Bari Mosque|Qasba Mosque|Kirtankhola River|Bell''s Park'),
    ('patuakhali', 'Kuakata Sea Beach|Gangamati Beach|Gangamati Reserved Forest|Lebur Char|Fatrar Char|Rakhine Palli|Kuakata Buddhist Temple|Misripara Buddhist Temple|Kuakata Well|Payra Port area'),
    ('bhola', 'Monpura Island|Char Kukri-Mukri Wildlife Sanctuary|Tarua Sea Beach|Dhal Char|Char Fasson|Jacob Tower|Meghna River|Tetulia River'),
    ('jhalokathi', 'Bhimruli Floating Guava Market|Gabkhan Channel|Gabkhan Bridge|Kirtipasha Zamindar Bari|Sujabad Fort area|Sugandha River|Floating markets'),
    ('pirojpur', 'Kuriana Floating Market|Swarupkathi|Floating guava gardens|Momin Mosque|Rayerkathi Zamindar Bari|Baleshwar River|Sandha River'),
    ('barguna', 'Tengragiri Eco Park|Sonakata Eco Park|Haringhata Forest|Laldia Beach|Patharghata|Bishkhali River|Taltali coastal forest|Sonakata Beach')
), listed_places as (
  select source.district_slug, trim(name) as name
  from source cross join lateral unnest(string_to_array(source.names, '|')) as name
)
insert into public.places (district_id, name, slug, upazila_or_area, category, short_description, best_time, how_to_reach, practical_tips, status)
select district.id, place.name,
  trim(both '-' from regexp_replace(lower(place.name), '[^a-z0-9]+', '-', 'g')),
  district.name,
  case
    when place.name ilike '%Beach%' or place.name ilike '%Sea%' or place.name ilike '%Char%' or place.name ilike '%coastal%' or place.name ilike '%Forest%' then 'Coast and nature'
    when place.name ilike '%River%' or place.name ilike '%Channel%' or place.name ilike '%Bridge%' then 'Riverfront and waterway'
    when place.name ilike '%Mosque%' or place.name ilike '%Temple%' or place.name ilike '%Church%' then 'Religious and historic site'
    when place.name ilike '%Bari%' or place.name ilike '%Fort%' or place.name ilike '%heritage%' then 'Historic site'
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
