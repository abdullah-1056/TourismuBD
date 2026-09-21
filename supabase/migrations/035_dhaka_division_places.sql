with seeded_districts as (
  insert into public.districts (name, division, slug, district_code, display_order, status)
  values
    ('Dhaka', 'Dhaka', 'dhaka', 'dhaka', 10, 'PUBLISHED'),
    ('Faridpur', 'Dhaka', 'faridpur', 'faridpur', 11, 'PUBLISHED'),
    ('Gazipur', 'Dhaka', 'gazipur', 'gazipur', 12, 'PUBLISHED'),
    ('Gopalganj', 'Dhaka', 'gopalganj', 'gopalganj', 13, 'PUBLISHED'),
    ('Kishoreganj', 'Dhaka', 'kishoreganj', 'kishoreganj', 14, 'PUBLISHED'),
    ('Madaripur', 'Dhaka', 'madaripur', 'madaripur', 15, 'PUBLISHED'),
    ('Manikganj', 'Dhaka', 'manikganj', 'manikganj', 16, 'PUBLISHED'),
    ('Munshiganj', 'Dhaka', 'munshiganj', 'munshiganj', 17, 'PUBLISHED'),
    ('Narayanganj', 'Dhaka', 'narayanganj', 'narayanganj', 18, 'PUBLISHED'),
    ('Narsingdi', 'Dhaka', 'narsingdi', 'narsingdi', 19, 'PUBLISHED'),
    ('Rajbari', 'Dhaka', 'rajbari', 'rajbari', 20, 'PUBLISHED'),
    ('Shariatpur', 'Dhaka', 'shariatpur', 'shariatpur', 21, 'PUBLISHED'),
    ('Tangail', 'Dhaka', 'tangail', 'tangail', 22, 'PUBLISHED')
  on conflict (slug) do update set name = excluded.name, division = excluded.division, district_code = excluded.district_code, display_order = excluded.display_order, status = excluded.status
  returning id, slug, name
), source(district_slug, names) as (
  values
    ('dhaka', 'Lalbagh Fort|Ahsan Manzil|Bangladesh National Parliament|Bangladesh National Museum|National Martyrs'' Memorial, Savar|Central Shaheed Minar|Dhakeshwari National Temple|Star Mosque|Armenian Church|Curzon Hall|Bahadur Shah Park|Liberation War Museum|Sadarghat|Buriganga River|Ramna Park|Rose Garden Palace|Sat Gambuj Mosque|Baitul Mukarram National Mosque'),
    ('faridpur', 'Mathurapur Deul|Satoir Shahi Jame Mosque|Gerda Mosque|Faridpur Riverfront|Sheikh Rasel Shishu Park|Kanaipur Zamindar Bari|Jasimuddin''s House/Museum area'),
    ('gazipur', 'Bhawal National Park|Gazipur Safari Park|Nuhash Palli|Bhawal Rajbari|Bangabandhu Hi-Tech City area|Belai Beel|St. Nicholas Church, Kaliganj'),
    ('gopalganj', 'Tungipara historic complex|Orakandi Thakur Bari|Ulpur Zamindar Bari|Court Mosque|Madhumati River|Sheikh Russell Shishu Park|Bangabandhu Mausoleum Complex'),
    ('kishoreganj', 'Nikli Haor|Mithamain Haor|Austagram Haor|Sholakia Eidgah|Pagla Mosque|Jangalbari Fort|Egarosindur Fort|Chandrabati Temple|President Abdul Hamid Road / Haor Road'),
    ('madaripur', 'Shakuni Lake|Raja Ram Temple|Auliapur Neelkuthi|Senapati Dighi|Arial Khan River|Hazrat Shah Madar area'),
    ('manikganj', 'Baliati Palace|Teota Zamindar Bari|Betila Zamindar Bari|Paturia Ghat|Aricha Ghat|Kaliganga River area'),
    ('munshiganj', 'Idrakpur Fort|Nateshwar Buddhist Archaeological Site|Baba Adam Mosque|Sonarang Twin Temples|Atish Dipankar birthplace|Mawa Padma Riverfront|Padma Bridge viewpoint|Bikrampur archaeological sites'),
    ('narayanganj', 'Panam City|Bangladesh Folk Art & Craft Museum|Goaldi Mosque|Sonakanda Fort|Hajiganj Fort|Murapara Zamindar Palace|Langalband|Meghna River|Sonargaon historic area'),
    ('narsingdi', 'Wari-Bateshwar Archaeological Site|Balapur Zamindar Bari|Meghna River|Dream Holiday Park|Bir Shrestha Matiur Rahman Memorial area|Lakshman Saha Zamindar Bari'),
    ('rajbari', 'Goalanda Ghat|Daulatdia Riverfront|Mir Mosharraf Hossain Memorial|Padma River|Rajbari historic railway area|Jor Bangla Temple'),
    ('shariatpur', 'Dhanuka Manasa Bari|Sureshwar Darbar Sharif|Kartikpur Zamindar Bari|Padma River|Naria riverbank|Dhanuka historic area'),
    ('tangail', 'Mahera Zamindar Bari|Atia Mosque|Madhupur National Park|Dhanbari Nawab Palace|Pirgacha Rubber Garden|Jamuna River|Elenga|Pakutia Zamindar Bari')
), listed_places as (
  select source.district_slug, trim(name) as name
  from source cross join lateral unnest(string_to_array(source.names, '|')) as name
)
insert into public.places (district_id, name, slug, upazila_or_area, category, short_description, best_time, how_to_reach, practical_tips, status)
select district.id, place.name,
  case place.name
    when 'Jasimuddin''s House/Museum area' then 'jasimuddin-house-museum-area'
    else trim(both '-' from regexp_replace(lower(place.name), '[^a-z0-9]+', '-', 'g'))
  end,
  district.name,
  case
    when place.name ilike '%River%' then 'River'
    when place.name ilike '%Haor%' or place.name ilike '%Beel%' then 'Wetland'
    when place.name ilike '%Lake%' then 'Lake'
    when place.name ilike '%Park%' then 'Park'
    when place.name ilike '%Mosque%' or place.name ilike '%Temple%' or place.name ilike '%Church%' or place.name ilike '%Darbar%' then 'Religious and historic site'
    when place.name ilike '%Fort%' or place.name ilike '%Palace%' or place.name ilike '%Bari%' or place.name ilike '%Archaeological%' then 'Historic site'
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
