with faridpur as (
  insert into public.districts (name, division, slug, district_code, display_order, status)
  values ('Faridpur', 'Dhaka', 'faridpur', 'faridpur', 1, 'PUBLISHED')
  on conflict (slug) do update set name = excluded.name, division = excluded.division, district_code = excluded.district_code, display_order = excluded.display_order, status = excluded.status
  returning id
)
insert into public.places (district_id, name, slug, upazila_or_area, category, short_description, best_time, how_to_reach, practical_tips, status)
select faridpur.id, place.name, place.slug, place.area, place.category, place.description, 'November to March', place.directions, place.tips, 'PUBLISHED'
from faridpur
cross join (
  values
    ('Mathurapur Deul', 'mathurapur-deul', 'Mathurapur, Faridpur', 'Historic site', 'A historic deul in the Faridpur area.', 'Travel from Faridpur town using local road transport.', 'Check current access conditions before travel.'),
    ('Satoir Shahi Jame Mosque', 'satoir-shahi-jame-mosque', 'Satoir, Faridpur', 'Religious and historic site', 'A notable mosque in Satoir.', 'Travel from Faridpur town by local road transport toward Satoir.', 'Dress respectfully and follow local mosque access guidance.'),
    ('Gerda Mosque', 'gerda-mosque', 'Gerda, Faridpur', 'Religious and historic site', 'A mosque in Gerda that can be included in a Faridpur heritage visit.', 'Use local transport from Faridpur town toward Gerda.', 'Respect prayer times and local photography rules.'),
    ('Faridpur Riverfront', 'faridpur-riverfront', 'Faridpur town', 'Riverfront', 'A riverfront stop in Faridpur for a relaxed town-side visit.', 'Travel by local transport from central Faridpur.', 'Visit in daylight and check local weather before going.'),
    ('Sheikh Rasel Shishu Park', 'sheikh-rasel-shishu-park', 'Faridpur town', 'Park', 'A family-oriented park in Faridpur town.', 'Use local transport from central Faridpur.', 'Check opening hours before visiting.'),
    ('Kanaipur Zamindar Bari', 'kanaipur-zamindar-bari', 'Kanaipur, Faridpur', 'Historic site', 'A zamindar-bari area in Kanaipur.', 'Travel from Faridpur town toward Kanaipur by local road transport.', 'Ask locally about entry access before visiting the property.'),
    ('Jasimuddin''s House/Museum area', 'jasimuddin-house-museum-area', 'Faridpur', 'Cultural heritage', 'An area associated with poet Jasimuddin.', 'Travel from Faridpur town using local transport and confirm the visitor point locally.', 'Confirm visitor access and opening information before travel.')
) as place(name, slug, area, category, description, directions, tips)
on conflict (district_id, slug) do update set name = excluded.name, upazila_or_area = excluded.upazila_or_area, category = excluded.category, short_description = excluded.short_description, best_time = excluded.best_time, how_to_reach = excluded.how_to_reach, practical_tips = excluded.practical_tips, status = excluded.status;
