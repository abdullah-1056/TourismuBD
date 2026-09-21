with seeded_districts as (
  insert into public.districts (name,division,slug,district_code,display_order,status) values
    ('Khulna','Khulna','khulna','khulna',56,'PUBLISHED'),('Bagerhat','Khulna','bagerhat','bagerhat',57,'PUBLISHED'),('Satkhira','Khulna','satkhira','satkhira',58,'PUBLISHED'),('Jashore','Khulna','jashore','jashore',59,'PUBLISHED'),('Narail','Khulna','narail','narail',60,'PUBLISHED'),('Magura','Khulna','magura','magura',61,'PUBLISHED'),('Jhenaidah','Khulna','jhenaidah','jhenaidah',62,'PUBLISHED'),('Kushtia','Khulna','kushtia','kushtia',63,'PUBLISHED'),('Chuadanga','Khulna','chuadanga','chuadanga',64,'PUBLISHED'),('Meherpur','Khulna','meherpur','meherpur',65,'PUBLISHED')
  on conflict (slug) do update set name=excluded.name,division=excluded.division,district_code=excluded.district_code,display_order=excluded.display_order,status=excluded.status returning id,slug,name
), source(district_slug,names) as (values
 ('khulna','Rupsha River|Rupsha Bridge|Gallamari Memorial|Dakshindihi — Tagore family heritage|Pithabhog — Tagore ancestral site|Khulna Divisional Museum|Sundarbans gateway areas'),
 ('bagerhat','Sixty Dome Mosque|Khan Jahan Ali Mausoleum|Nine Dome Mosque|Singair Mosque|Bagerhat Museum|Ghora Dighi|Mongla|Karamjal Wildlife Centre|Sundarbans|Dhangmari area'),
 ('satkhira','Sundarbans|Burigoalini|Munshiganj Sundarbans gateway|Mandarbaria Sea Beach|Jeshoreshwari Kali Temple|Nalta Sharif|Akashlina Eco Tourism Centre|Kalagachhia Eco Tourism area'),
 ('jashore','Sagardari|Michael Madhusudan Dutt Memorial|Godkhali Flower Fields|Chanchra Shiva Temple|Jess Garden Park|Jessore Collectorate heritage area|Bhairab River'),
 ('narail','SM Sultan Memorial Complex|Chitra River|Birshreshtha Noor Mohammad Memorial|Victoria College heritage area|Arunima countryside area'),
 ('magura','Raja Sitaram Ray Palace ruins|Mohammadpur historic area|Siddheshwari Math|Nabaganga River|Atharokhada archaeological/historic sites'),
 ('jhenaidah','Barobazar Archaeological Sites|Naldanga Temple Complex|Pagla Kanai Shrine|Dhol Samudra Dighi|K.P. Basu ancestral house|Shailkupa Ram Gopal Temple'),
 ('kushtia','Lalon Shah Shrine|Shilaidaha Kuthibari|Kangal Harinath Museum|Mir Mosharraf Hossain Memorial|Gorai River|Tagore heritage area|Lalon Academy'),
 ('chuadanga','Karpasdanga Neelkuthi|Kazi Nazrul memorial sites at Karpasdanga|Carew & Co. historic industrial area, Darshana|Darshana railway heritage|Mathabhanga River|Liberation War memorial sites'),
 ('meherpur','Mujibnagar Memorial Complex|Mujibnagar Mango Grove|Amjhupi Neelkuthi|Bhatpara Neelkuthi|Meherpur historic sites|Bhairab River')
), listed_places as (select district_slug,trim(name) name from source cross join lateral unnest(string_to_array(names,'|')) name)
insert into public.places (district_id,name,slug,upazila_or_area,category,short_description,best_time,how_to_reach,practical_tips,status)
select d.id,p.name,trim(both '-' from regexp_replace(lower(p.name),'[^a-z0-9]+','-','g')),d.name,
case when p.name ilike '%Sundarbans%' or p.name ilike '%Wildlife%' or p.name ilike '%Beach%' or p.name ilike '%Flower%' or p.name ilike '%countryside%' then 'Nature and landscape' when p.name ilike '%River%' or p.name ilike '%Bridge%' or p.name ilike '%Dighi%' then 'Riverfront and waterway' when p.name ilike '%Mosque%' or p.name ilike '%Temple%' or p.name ilike '%Shrine%' or p.name ilike '%Math%' then 'Religious and historic site' when p.name ilike '%Memorial%' or p.name ilike '%Museum%' or p.name ilike '%heritage%' or p.name ilike '%Kuthibari%' or p.name ilike '%Neelkuthi%' or p.name ilike '%Archaeological%' or p.name ilike '%Palace%' or p.name ilike '%house%' then 'Historic site' else 'Tourist place' end,
format('%s is a listed visitor destination in %s.',p.name,d.name),'November to March','Use available local transport and confirm the final approach locally.','Check current access, weather, and opening information before visiting.','PUBLISHED'
from seeded_districts d join listed_places p on p.district_slug=d.slug
on conflict (district_id,slug) do update set name=excluded.name,upazila_or_area=excluded.upazila_or_area,category=excluded.category,short_description=excluded.short_description,best_time=excluded.best_time,how_to_reach=excluded.how_to_reach,practical_tips=excluded.practical_tips,status=excluded.status;
