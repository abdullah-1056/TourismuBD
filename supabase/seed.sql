insert into public.districts (district_code, name, division, slug, status)
values ('sylhet', 'Sylhet', 'Sylhet', 'sylhet', 'PUBLISHED')
on conflict (slug) do update
set name = excluded.name, division = excluded.division, status = excluded.status;

insert into public.places (
  district_id, name, slug, upazila_or_area, category, latitude, longitude,
  short_description, best_time, how_to_reach, practical_tips, status
)
select
  d.id, seed.name, seed.slug, seed.area, seed.category, seed.latitude, seed.longitude,
  seed.short_description, seed.best_time, seed.how_to_reach, seed.practical_tips,
  'PUBLISHED'::public.record_status
from public.districts d
cross join (values
  (
    'Ratargul Swamp Forest', 'ratargul-swamp-forest', 'Gowainghat', 'Forest waterway',
    25.001, 91.978,
    'A freshwater swamp forest explored by small local boats when water levels allow.',
    'Recommended: Monsoon and early post-monsoon. Why: Higher water levels make the forest waterways easier to explore by boat. Caution: Water depth, boat access, and conditions change with rainfall.',
    'Travel from Sylhet city toward Gowainghat, then use the local Ratargul access road and boat point.',
    'Confirm water level and boat availability locally before leaving Sylhet city.'
  ),
  (
    'Jaflong', 'jaflong', 'Gowainghat', 'River and hills',
    25.166, 92.017,
    'A border-side landscape known for the Piyain River, stone beds, and views toward the Khasi hills.',
    'Recommended: October to March. Why: Clearer weather is comfortable for riverbank walks and day trips. Caution: Monsoon currents can be strong and river conditions can change quickly.',
    'Use the Sylhet-Jaflong road from Sylhet city by bus, reserved car, or local transport.',
    'Start early; the road is busy on weekends and public holidays.'
  ),
  (
    'Lalakhal', 'lalakhal', 'Jaintiapur', 'River',
    25.105, 92.171,
    'A river destination on the Sari River corridor, visited for boat rides and surrounding hill views.',
    'Recommended: November to March. Why: Drier weather usually provides calmer day-trip conditions. Caution: Water colour and boat conditions vary by season and rainfall.',
    'Travel from Sylhet city toward Sarighat on the Jaflong road, then continue to a local Lalakhal boat point.',
    'Agree on the boat route, duration, and fare before departure.'
  ),
  (
    'Bichanakandi', 'bichanakandi', 'Gowainghat', 'Stone bed and stream',
    25.171, 91.887,
    'A borderland stone bed where hill streams meet beside views of the Meghalaya foothills.',
    'Recommended: June to September. Why: Monsoon water brings the streams and surrounding landscape to life. Caution: Rocks are slippery and currents can rise after heavy rain.',
    'Travel from Sylhet city toward Hadarpar, then continue by local boat or available road transport.',
    'Wear footwear with grip and check the return transport schedule before exploring.'
  ),
  (
    'Panthumai', 'panthumai', 'West Jaflong, Gowainghat', 'Village and waterfall viewpoint',
    25.1760963, 91.9566475,
    'A border village offering a Bangladesh-side view of a waterfall descending from Meghalaya.',
    'Recommended: June to September. Why: Monsoon rainfall gives the waterfall its strongest flow. Caution: The waterfall is across the international border; remain on the Bangladesh side.',
    'Travel from Sylhet city toward Gowainghat and continue by local road transport to Panthumai village.',
    'Respect border instructions and avoid entering restricted water or land areas.'
  ),
  (
    'Khadimnagar National Park', 'khadimnagar-national-park', 'Khadimnagar', 'National park',
    24.964, 91.998,
    'A protected evergreen forest near Sylhet city with walking trails and quiet woodland scenery.',
    'Recommended: October to March. Why: Cooler, drier weather is more comfortable for walking forest trails. Caution: Trail conditions may be muddy during rain; follow local forest guidance.',
    'Travel east from Sylhet city toward Khadimnagar by reserved or local road transport.',
    'Visit in daylight and check current entry guidance at the forest office.'
  ),
  (
    'Hazrat Shah Jalal Dargah', 'hazrat-shah-jalal-dargah', 'Dargah Mahalla, Sylhet city', 'Religious and historic site',
    24.899, 91.868,
    'The shrine complex of Sufi saint Hazrat Shah Jalal, one of Sylhet city''s best-known landmarks.',
    'Recommended: Year-round. Why: The city-centre site is accessible in every season. Caution: It can be crowded during religious occasions and weekly peak periods.',
    'Use a rickshaw, CNG auto-rickshaw, or walk from central Sylhet to Dargah Gate.',
    'Dress respectfully and follow the separate access and photography rules posted on site.'
  ),
  (
    'Hazrat Shah Paran Dargah', 'hazrat-shah-paran-dargah', 'Shah Paran', 'Religious and historic site',
    24.897, 91.933,
    'A hilltop shrine complex associated with Sufi saint Hazrat Shah Paran on the eastern side of Sylhet city.',
    'Recommended: Year-round. Why: Road access from Sylhet city makes it a practical visit in any season. Caution: Steps and sloped paths may be difficult for some visitors.',
    'Travel east from Sylhet city on the Tamabil road and take local access to the shrine complex.',
    'Dress respectfully and allow extra time during busy religious periods.'
  ),
  (
    'Malnichhara Tea Estate', 'malnichhara-tea-estate', 'Airport Road, Sylhet city', 'Tea landscape',
    24.921, 91.856,
    'A historic tea estate on the edge of Sylhet city, known for its rolling tea-garden landscape.',
    'Recommended: October to March. Why: Cooler, drier weather is pleasant for viewing the tea landscape. Caution: This is a working estate; visitor access can be restricted.',
    'Travel from central Sylhet toward Airport Road by rickshaw, CNG auto-rickshaw, or reserved car.',
    'Ask for permission before entering estate roads or photographing workers.'
  ),
  (
    'Lakkatura Tea Garden', 'lakkatura-tea-garden', 'Airport Road, Sylhet city', 'Tea landscape',
    24.933, 91.883,
    'A working tea garden close to Sylhet city, valued for broad green slopes and an easy city-side location.',
    'Recommended: October to March. Why: Milder weather makes roadside viewing and short visits more comfortable. Caution: Access beyond public roads depends on estate permission.',
    'Follow Airport Road north from central Sylhet using local or reserved transport.',
    'Keep to public access areas unless estate staff explicitly permit entry.'
  )
) as seed(
  name, slug, area, category, latitude, longitude, short_description,
  best_time, how_to_reach, practical_tips
)
where d.slug = 'sylhet'
on conflict (district_id, slug) do update set
  name = excluded.name,
  upazila_or_area = excluded.upazila_or_area,
  category = excluded.category,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  short_description = excluded.short_description,
  best_time = excluded.best_time,
  how_to_reach = excluded.how_to_reach,
  practical_tips = excluded.practical_tips,
  status = excluded.status;

insert into public.place_aliases (place_id, alias)
select p.id, aliases.alias
from public.places p
join public.districts d on d.id = p.district_id and d.slug = 'sylhet'
join (values
  ('ratargul-swamp-forest', 'Ratargul'),
  ('ratargul-swamp-forest', 'Ratargul Swamp Forest'),
  ('jaflong', 'Jaflong Zero Point'),
  ('lalakhal', 'Lala Khal'),
  ('lalakhal', 'Sari River'),
  ('bichanakandi', 'Bisnakandi'),
  ('bichanakandi', 'Bichnakandi'),
  ('panthumai', 'Panthumai Waterfall Viewpoint'),
  ('panthumai', 'Panthumai Jhorna'),
  ('khadimnagar-national-park', 'Khadim Nagar National Park'),
  ('hazrat-shah-jalal-dargah', 'Shahjalal Dargah'),
  ('hazrat-shah-jalal-dargah', 'Dargah Gate'),
  ('hazrat-shah-paran-dargah', 'Shah Paran Mazar'),
  ('hazrat-shah-paran-dargah', 'Shahporan Dargah'),
  ('malnichhara-tea-estate', 'Malnicherra Tea Estate'),
  ('malnichhara-tea-estate', 'Malni Chhara Tea Garden'),
  ('lakkatura-tea-garden', 'Lakkatura Tea Estate'),
  ('lakkatura-tea-garden', 'Lakkatura Tea Garden')
) as aliases(place_slug, alias) on aliases.place_slug = p.slug
on conflict (place_id, alias) do nothing;

-- Real providers, bookings, reviews, and ratings are intentionally not seeded.
