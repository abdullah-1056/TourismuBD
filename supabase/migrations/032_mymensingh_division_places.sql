with seeded_districts as (
  insert into public.districts (name, division, slug, district_code, display_order, status)
  values
    ('Mymensingh', 'Mymensingh', 'mymensingh', 'mymensingh', 2, 'PUBLISHED'),
    ('Jamalpur', 'Mymensingh', 'jamalpur', 'jamalpur', 3, 'PUBLISHED'),
    ('Netrokona', 'Mymensingh', 'netrokona', 'netrokona', 4, 'PUBLISHED'),
    ('Sherpur', 'Mymensingh', 'sherpur', 'sherpur', 5, 'PUBLISHED')
  on conflict (slug) do update set name = excluded.name, division = excluded.division, district_code = excluded.district_code, display_order = excluded.display_order, status = excluded.status
  returning id, slug
)
insert into public.places (district_id, name, slug, upazila_or_area, category, short_description, best_time, how_to_reach, practical_tips, status)
select district.id, place.name, place.slug, place.area, place.category, place.description, 'November to March', 'Use available local transport and confirm the final approach locally.', 'Check current access, weather, and opening information before visiting.', 'PUBLISHED'
from seeded_districts district
join (
  values
    ('mymensingh', 'Shashi Lodge', 'shashi-lodge', 'Mymensingh city', 'Historic site', 'A listed visitor destination in Mymensingh.'),
    ('mymensingh', 'Zainul Abedin Museum', 'zainul-abedin-museum', 'Mymensingh city', 'Museum and cultural heritage', 'A listed visitor destination in Mymensingh.'),
    ('mymensingh', 'Muktagacha Zamindar Bari', 'muktagacha-zamindar-bari', 'Muktagacha', 'Historic site', 'A listed visitor destination in Mymensingh.'),
    ('mymensingh', 'Alexander Castle', 'alexander-castle', 'Mymensingh city', 'Historic site', 'A listed visitor destination in Mymensingh.'),
    ('mymensingh', 'Bangladesh Agricultural University campus', 'bangladesh-agricultural-university-campus', 'Mymensingh city', 'University campus', 'A listed visitor destination in Mymensingh.'),
    ('mymensingh', 'Botanical Garden', 'mymensingh-botanical-garden', 'Mymensingh city', 'Garden', 'A listed visitor destination in Mymensingh.'),
    ('mymensingh', 'Brahmaputra Riverfront', 'mymensingh-brahmaputra-riverfront', 'Mymensingh city', 'Riverfront', 'A listed visitor destination in Mymensingh.'),
    ('mymensingh', 'Silver Palace', 'silver-palace', 'Mymensingh city', 'Historic site', 'A listed visitor destination in Mymensingh.'),
    ('mymensingh', 'Bipin Park', 'bipin-park', 'Mymensingh city', 'Park', 'A listed visitor destination in Mymensingh.'),
    ('jamalpur', 'Lauchapra Picnic Spot', 'lauchapra-picnic-spot', 'Jamalpur', 'Picnic spot', 'A listed visitor destination in Jamalpur.'),
    ('jamalpur', 'Hazrat Shah Jamal Shrine', 'hazrat-shah-jamal-shrine', 'Jamalpur', 'Religious and historic site', 'A listed visitor destination in Jamalpur.'),
    ('jamalpur', 'Doyamoyee Temple', 'doyamoyee-temple', 'Jamalpur', 'Religious and historic site', 'A listed visitor destination in Jamalpur.'),
    ('jamalpur', 'Jamuna River', 'jamuna-river-jamalpur', 'Jamalpur', 'River', 'A listed visitor destination in Jamalpur.'),
    ('jamalpur', 'Brahmaputra River', 'brahmaputra-river-jamalpur', 'Jamalpur', 'River', 'A listed visitor destination in Jamalpur.'),
    ('jamalpur', 'Gandhi Ashram-related local heritage sites', 'gandhi-ashram-heritage-sites', 'Jamalpur', 'Cultural heritage', 'A listed visitor destination in Jamalpur.'),
    ('jamalpur', 'Bakshiganj hill-border countryside', 'bakshiganj-hill-border-countryside', 'Bakshiganj', 'Countryside', 'A listed visitor destination in Jamalpur.'),
    ('netrokona', 'Birishiri', 'birishiri', 'Durgapur', 'Landscape and river', 'A listed visitor destination in Netrokona.'),
    ('netrokona', 'Susang Durgapur', 'susang-durgapur', 'Durgapur', 'Historic and cultural site', 'A listed visitor destination in Netrokona.'),
    ('netrokona', 'Someshwari River', 'someshwari-river', 'Durgapur', 'River', 'A listed visitor destination in Netrokona.'),
    ('netrokona', 'Bijoypur China Clay Hills', 'bijoypur-china-clay-hills', 'Durgapur', 'Hills and landscape', 'A listed visitor destination in Netrokona.'),
    ('netrokona', 'Garo Hills', 'garo-hills-netrokona', 'Netrokona', 'Hills and landscape', 'A listed visitor destination in Netrokona.'),
    ('netrokona', 'Kamala Rani Dighi', 'kamala-rani-dighi', 'Netrokona', 'Historic site', 'A listed visitor destination in Netrokona.'),
    ('netrokona', 'Susang Zamindar Palace ruins', 'susang-zamindar-palace-ruins', 'Durgapur', 'Historic site', 'A listed visitor destination in Netrokona.'),
    ('netrokona', 'Durgapur Cultural Academy', 'durgapur-cultural-academy', 'Durgapur', 'Cultural heritage', 'A listed visitor destination in Netrokona.'),
    ('netrokona', 'Haor areas', 'netrokona-haor-areas', 'Netrokona', 'Wetland', 'A listed visitor destination in Netrokona.'),
    ('sherpur', 'Gajni Abakash', 'gajni-abakash', 'Jhenaigati', 'Park and landscape', 'A listed visitor destination in Sherpur.'),
    ('sherpur', 'Madhutila Eco Park', 'madhutila-eco-park', 'Nalitabari', 'Eco park', 'A listed visitor destination in Sherpur.'),
    ('sherpur', 'Panihata-Tarani Hills', 'panihata-tarani-hills', 'Sherpur', 'Hills and landscape', 'A listed visitor destination in Sherpur.'),
    ('sherpur', 'Raja Pahar', 'raja-pahar', 'Sherpur', 'Hills and landscape', 'A listed visitor destination in Sherpur.'),
    ('sherpur', 'Nalitabari hills', 'nalitabari-hills', 'Nalitabari', 'Hills and landscape', 'A listed visitor destination in Sherpur.'),
    ('sherpur', 'Garo Hills', 'garo-hills-sherpur', 'Sherpur', 'Hills and landscape', 'A listed visitor destination in Sherpur.'),
    ('sherpur', 'Border viewpoints', 'sherpur-border-viewpoints', 'Sherpur', 'Viewpoint', 'A listed visitor destination in Sherpur.'),
    ('sherpur', 'Maharashi River area', 'maharashi-river-area', 'Sherpur', 'River', 'A listed visitor destination in Sherpur.')
) as place(district_slug, name, slug, area, category, description) on place.district_slug = district.slug
on conflict (district_id, slug) do update set name = excluded.name, upazila_or_area = excluded.upazila_or_area, category = excluded.category, short_description = excluded.short_description, best_time = excluded.best_time, how_to_reach = excluded.how_to_reach, practical_tips = excluded.practical_tips, status = excluded.status;
