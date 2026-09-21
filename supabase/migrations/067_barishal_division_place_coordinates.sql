-- Barishal Division only; district joins disambiguate the Bhola Meghna River.
-- Broad landscapes use representative visitor points; routing access stays in app data.
-- Sujabad uses a village-area pin, not surveyed fort remains.
begin;

update public.places as place
set latitude = mapped.latitude,
    longitude = mapped.longitude,
    updated_at = now()
from public.districts as district
join (
  values
    ('barishal', 'oxford-mission-church', 22.7043193::numeric, 90.3628335::numeric),
    ('barishal', 'durga-sagar', 22.7609595::numeric, 90.2902504::numeric),
    ('barishal', 'satla-water-lily-beel', 22.9102190::numeric, 90.0674360::numeric),
    ('barishal', 'guthia-baitul-aman-jame-mosque', 22.7830410::numeric, 90.2388530::numeric),
    ('barishal', 'korapur-mia-bari-mosque', 22.7243349::numeric, 90.2866786::numeric),
    ('barishal', 'qasba-mosque', 22.9891139::numeric, 90.2207022::numeric),
    ('barishal', 'kirtankhola-river', 22.7042466::numeric, 90.3773030::numeric),
    ('barishal', 'bell-s-park', 22.6926953::numeric, 90.3689195::numeric),
    ('patuakhali', 'kuakata-sea-beach', 21.8130846::numeric, 90.1226475::numeric),
    ('patuakhali', 'gangamati-beach', 21.8058000::numeric, 90.1925000::numeric),
    ('patuakhali', 'gangamati-reserved-forest', 21.8051000::numeric, 90.1918000::numeric),
    ('patuakhali', 'lebur-char', 21.8427902::numeric, 90.0854773::numeric),
    ('patuakhali', 'fatrar-char', 21.8665290::numeric, 90.0764290::numeric),
    ('patuakhali', 'rakhine-palli', 21.8165000::numeric, 90.1240000::numeric),
    ('patuakhali', 'kuakata-buddhist-temple', 21.8158610::numeric, 90.1229400::numeric),
    ('patuakhali', 'misripara-buddhist-temple', 21.8338267::numeric, 90.1764061::numeric),
    ('patuakhali', 'kuakata-well', 21.8159000::numeric, 90.1232000::numeric),
    ('patuakhali', 'payra-port-area', 21.9897222::numeric, 90.2780691::numeric),
    ('bhola', 'monpura-island', 22.2006954::numeric, 90.9575136::numeric),
    ('bhola', 'char-kukri-mukri-wildlife-sanctuary', 21.9349670::numeric, 90.6522125::numeric),
    ('bhola', 'tarua-sea-beach', 21.8750000::numeric, 90.7360000::numeric),
    ('bhola', 'dhal-char', 21.8928956::numeric, 90.7362469::numeric),
    ('bhola', 'char-fasson', 22.1862993::numeric, 90.7600613::numeric),
    ('bhola', 'jacob-tower', 22.1859150::numeric, 90.7601060::numeric),
    ('bhola', 'meghna-river', 22.8209018::numeric, 90.7119389::numeric),
    ('bhola', 'tetulia-river', 22.6480000::numeric, 90.5310000::numeric),
    ('jhalokathi', 'bhimruli-floating-guava-market', 22.7137533::numeric, 90.1628405::numeric),
    ('jhalokathi', 'gabkhan-channel', 22.6657428::numeric, 90.1322746::numeric),
    ('jhalokathi', 'gabkhan-bridge', 22.6412725::numeric, 90.1790737::numeric),
    ('jhalokathi', 'kirtipasha-zamindar-bari', 22.6819100::numeric, 90.1666980::numeric),
    ('jhalokathi', 'sujabad-fort-area', 22.6696500::numeric, 90.2942600::numeric),
    ('jhalokathi', 'sugandha-river', 22.6401304::numeric, 90.2567678::numeric),
    ('jhalokathi', 'floating-markets', 22.7165000::numeric, 90.1660000::numeric),
    ('pirojpur', 'kuriana-floating-market', 22.7400959::numeric, 90.1545383::numeric),
    ('pirojpur', 'swarupkathi', 22.7473418::numeric, 90.1014418::numeric),
    ('pirojpur', 'floating-guava-gardens', 22.7460000::numeric, 90.1530000::numeric),
    ('pirojpur', 'momin-mosque', 22.3831336::numeric, 89.9426224::numeric),
    ('pirojpur', 'rayerkathi-zamindar-bari', 22.6003623::numeric, 89.9853156::numeric),
    ('pirojpur', 'baleshwar-river', 22.5720000::numeric, 89.9690000::numeric),
    ('pirojpur', 'sandha-river', 22.7480000::numeric, 90.0930000::numeric),
    ('barguna', 'tengragiri-eco-park', 21.9850458::numeric, 90.0864631::numeric),
    ('barguna', 'sonakata-eco-park', 21.9855000::numeric, 90.0880000::numeric),
    ('barguna', 'haringhata-forest', 21.9799917::numeric, 89.9450047::numeric),
    ('barguna', 'laldia-beach', 21.9622817::numeric, 89.9820196::numeric),
    ('barguna', 'patharghata', 22.0372853::numeric, 89.9687065::numeric),
    ('barguna', 'bishkhali-river', 22.2733860::numeric, 90.1063028::numeric),
    ('barguna', 'taltali-coastal-forest', 21.9960000::numeric, 90.0920000::numeric),
    ('barguna', 'sonakata-beach', 21.9790000::numeric, 90.0880000::numeric)
) as mapped(district_slug, slug, latitude, longitude)
  on mapped.district_slug = district.slug
where place.district_id = district.id
  and place.slug = mapped.slug;

commit;

