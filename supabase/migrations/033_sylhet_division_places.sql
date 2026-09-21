with seeded_districts as (
  insert into public.districts (name, division, slug, district_code, display_order, status)
  values
    ('Sylhet', 'Sylhet', 'sylhet', 'sylhet', 6, 'PUBLISHED'),
    ('Moulvibazar', 'Sylhet', 'moulvibazar', 'moulvibazar', 7, 'PUBLISHED'),
    ('Habiganj', 'Sylhet', 'habiganj', 'habiganj', 8, 'PUBLISHED'),
    ('Sunamganj', 'Sylhet', 'sunamganj', 'sunamganj', 9, 'PUBLISHED')
  on conflict (slug) do update set name = excluded.name, division = excluded.division, district_code = excluded.district_code, display_order = excluded.display_order, status = excluded.status
  returning id, slug
)
insert into public.places (district_id, name, slug, upazila_or_area, category, short_description, best_time, how_to_reach, practical_tips, status)
select district.id, place.name, place.slug, place.area, place.category, place.description, 'November to March', 'Use available local transport and confirm the final approach locally.', 'Check current access, weather, and opening information before visiting.', 'PUBLISHED'
from seeded_districts district
join (
  values
    ('sylhet', 'Jaflong', 'jaflong', 'Gowainghat', 'River and hills', 'A Bangladesh Tourism Board-highlighted hill and water destination in Sylhet.'),
    ('sylhet', 'Ratargul Swamp Forest', 'ratargul-swamp-forest', 'Gowainghat', 'Forest waterway', 'A listed visitor destination in Sylhet.'),
    ('sylhet', 'Bichanakandi', 'bichanakandi', 'Gowainghat', 'Stone bed and stream', 'A Bangladesh Tourism Board-highlighted hill and water destination in Sylhet.'),
    ('sylhet', 'Lalakhal', 'lalakhal', 'Jaintiapur', 'River', 'A listed visitor destination in Sylhet.'),
    ('sylhet', 'Shrine of Hazrat Shah Jalal', 'hazrat-shah-jalal-dargah', 'Dargah Mahalla, Sylhet city', 'Religious and historic site', 'A listed visitor destination in Sylhet.'),
    ('sylhet', 'Shrine of Shah Paran', 'hazrat-shah-paran-dargah', 'Shah Paran', 'Religious and historic site', 'A listed visitor destination in Sylhet.'),
    ('sylhet', 'Malnichhara Tea Garden', 'malnichhara-tea-estate', 'Airport Road, Sylhet city', 'Tea landscape', 'A listed visitor destination in Sylhet.'),
    ('sylhet', 'Khadimnagar National Park', 'khadimnagar-national-park', 'Khadimnagar', 'National park', 'A listed visitor destination in Sylhet.'),
    ('sylhet', 'Pangthumai', 'panthumai', 'West Jaflong, Gowainghat', 'Village and waterfall viewpoint', 'A Bangladesh Tourism Board-highlighted hill and water destination in Sylhet.'),
    ('sylhet', 'Lakkatura Tea Garden', 'lakkatura-tea-garden', 'Airport Road, Sylhet city', 'Tea landscape', 'A listed visitor destination in Sylhet.'),
    ('sylhet', 'Tamabil', 'tamabil', 'Gowainghat', 'Border landscape', 'A listed visitor destination in Sylhet.'),
    ('sylhet', 'Utma Chhara', 'utma-chhara', 'Sylhet', 'Waterfall and stream', 'A listed visitor destination in Sylhet.'),
    ('moulvibazar', 'Sreemangal', 'sreemangal', 'Sreemangal', 'Tea landscape', 'A listed visitor destination in Moulvibazar.'),
    ('moulvibazar', 'Lawachara National Park', 'lawachara-national-park', 'Kamalganj', 'National park', 'A listed visitor destination in Moulvibazar.'),
    ('moulvibazar', 'Madhabkunda Waterfall', 'madhabkunda-waterfall', 'Barlekha', 'Waterfall', 'A Bangladesh Tourism Board-highlighted hill and water destination in Moulvibazar.'),
    ('moulvibazar', 'Madhabpur Lake', 'madhabpur-lake', 'Kamalganj', 'Lake', 'A listed visitor destination in Moulvibazar.'),
    ('moulvibazar', 'Baikka Beel', 'baikka-beel', 'Sreemangal', 'Wetland', 'A listed visitor destination in Moulvibazar.'),
    ('moulvibazar', 'Ham Ham Waterfall', 'ham-ham-waterfall', 'Kamalganj', 'Waterfall', 'A listed visitor destination in Moulvibazar.'),
    ('moulvibazar', 'Hakaluki Haor', 'hakaluki-haor', 'Moulvibazar', 'Wetland', 'A listed visitor destination in Moulvibazar.'),
    ('moulvibazar', 'Tea gardens', 'moulvibazar-tea-gardens', 'Moulvibazar', 'Tea landscape', 'A listed visitor destination in Moulvibazar.'),
    ('moulvibazar', 'Manipuri villages', 'manipuri-villages', 'Kamalganj', 'Cultural heritage', 'A listed visitor destination in Moulvibazar.'),
    ('moulvibazar', 'Adampur Forest', 'adampur-forest', 'Kamalganj', 'Forest', 'A listed visitor destination in Moulvibazar.'),
    ('moulvibazar', 'Madhabpur tea estate', 'madhabpur-tea-estate', 'Kamalganj', 'Tea landscape', 'A listed visitor destination in Moulvibazar.'),
    ('habiganj', 'Satchari National Park', 'satchari-national-park', 'Chunarughat', 'National park', 'A listed visitor destination in Habiganj.'),
    ('habiganj', 'Rema-Kalenga Wildlife Sanctuary', 'rema-kalenga-wildlife-sanctuary', 'Chunarughat', 'Wildlife sanctuary', 'A listed visitor destination in Habiganj.'),
    ('habiganj', 'Teliapara Memorial', 'teliapara-memorial', 'Madhabpur', 'Historic site', 'A listed visitor destination in Habiganj.'),
    ('habiganj', 'Bithangal Akhra', 'bithangal-akhra', 'Habiganj', 'Cultural heritage', 'A listed visitor destination in Habiganj.'),
    ('habiganj', 'Baniachang', 'baniachang', 'Baniachang', 'Historic and cultural site', 'A listed visitor destination in Habiganj.'),
    ('habiganj', 'Habiganj tea gardens', 'habiganj-tea-gardens', 'Habiganj', 'Tea landscape', 'A listed visitor destination in Habiganj.'),
    ('habiganj', 'Khowai River', 'khowai-river', 'Habiganj', 'River', 'A listed visitor destination in Habiganj.'),
    ('sunamganj', 'Tanguar Haor', 'tanguar-haor', 'Tahirpur', 'Wetland', 'A listed visitor destination in Sunamganj.'),
    ('sunamganj', 'Niladri Lake', 'niladri-lake', 'Tahirpur', 'Lake', 'A listed visitor destination in Sunamganj.'),
    ('sunamganj', 'Jadukata River', 'jadukata-river', 'Tahirpur', 'River', 'A listed visitor destination in Sunamganj.'),
    ('sunamganj', 'Shimul Bagan', 'shimul-bagan', 'Tahirpur', 'Landscape and seasonal garden', 'A listed visitor destination in Sunamganj.'),
    ('sunamganj', 'Barikka Tila', 'barikka-tila', 'Tahirpur', 'Hills and landscape', 'A listed visitor destination in Sunamganj.'),
    ('sunamganj', 'Tekerghat', 'tekerghat', 'Tahirpur', 'Lakeside and border landscape', 'A listed visitor destination in Sunamganj.'),
    ('sunamganj', 'Hason Raja Museum', 'hason-raja-museum', 'Sunamganj town', 'Museum and cultural heritage', 'A listed visitor destination in Sunamganj.'),
    ('sunamganj', 'Lakma Chhara', 'lakma-chhara', 'Sunamganj', 'Waterfall and stream', 'A listed visitor destination in Sunamganj.'),
    ('sunamganj', 'Meghalaya foothill viewpoints', 'meghalaya-foothill-viewpoints', 'Tahirpur', 'Viewpoint', 'A listed visitor destination in Sunamganj.')
) as place(district_slug, name, slug, area, category, description) on place.district_slug = district.slug
on conflict (district_id, slug) do update set name = excluded.name, upazila_or_area = excluded.upazila_or_area, category = excluded.category, short_description = excluded.short_description, best_time = excluded.best_time, how_to_reach = excluded.how_to_reach, practical_tips = excluded.practical_tips, status = excluded.status;
