-- Khulna Division only; district-scoped joins keep shared names separate.
-- Broad landscapes use representative visitor pins, not surveyed entrances.
-- Forest/island driving ends at mainland departures defined in app data.
begin;

update public.places as place
set latitude = mapped.latitude,
    longitude = mapped.longitude,
    updated_at = now()
from public.districts as district
join (
  values
    ('khulna', 'rupsha-river', 22.7645691::numeric, 89.5787803::numeric),
    ('khulna', 'rupsha-bridge', 22.7777187::numeric, 89.5838078::numeric),
    ('khulna', 'gallamari-memorial', 22.8003953::numeric, 89.5411517::numeric),
    ('khulna', 'dakshindihi-tagore-family-heritage', 22.9514510::numeric, 89.4478080::numeric),
    ('khulna', 'pithabhog-tagore-ancestral-site', 22.8169600::numeric, 89.6440800::numeric),
    ('khulna', 'khulna-divisional-museum', 22.8211200::numeric, 89.5518273::numeric),
    ('khulna', 'sundarbans-gateway-areas', 22.6038492::numeric, 89.5210646::numeric),
    ('bagerhat', 'sixty-dome-mosque', 22.6745009::numeric, 89.7418215::numeric),
    ('bagerhat', 'khan-jahan-ali-mausoleum', 22.6584485::numeric, 89.7585139::numeric),
    ('bagerhat', 'nine-dome-mosque', 22.6585064::numeric, 89.7554421::numeric),
    ('bagerhat', 'singair-mosque', 22.6728598::numeric, 89.7425879::numeric),
    ('bagerhat', 'bagerhat-museum', 22.6735738::numeric, 89.7426538::numeric),
    ('bagerhat', 'ghora-dighi', 22.6750000::numeric, 89.7395000::numeric),
    ('bagerhat', 'mongla', 22.4942200::numeric, 89.6016170::numeric),
    ('bagerhat', 'karamjal-wildlife-centre', 22.4286722::numeric, 89.5900583::numeric),
    ('bagerhat', 'sundarbans', 22.2984970::numeric, 89.6149370::numeric),
    ('bagerhat', 'dhangmari-area', 22.4500000::numeric, 89.5980000::numeric),
    ('satkhira', 'sundarbans', 21.7924338::numeric, 89.1697775::numeric),
    ('satkhira', 'burigoalini', 22.2891747::numeric, 89.1955968::numeric),
    ('satkhira', 'munshiganj-sundarbans-gateway', 22.2691709::numeric, 89.1949348::numeric),
    ('satkhira', 'mandarbaria-sea-beach', 21.6620000::numeric, 89.2260000::numeric),
    ('satkhira', 'jeshoreshwari-kali-temple', 22.3061295::numeric, 89.1126425::numeric),
    ('satkhira', 'nalta-sharif', 22.5141841::numeric, 89.0132086::numeric),
    ('satkhira', 'akashlina-eco-tourism-centre', 22.2728625::numeric, 89.1992031::numeric),
    ('satkhira', 'kalagachhia-eco-tourism-area', 22.2148606::numeric, 89.2388136::numeric),
    ('jashore', 'sagardari', 22.8385281::numeric, 89.1670988::numeric),
    ('jashore', 'michael-madhusudan-dutt-memorial', 22.8191838::numeric, 89.1634768::numeric),
    ('jashore', 'godkhali-flower-fields', 23.0810090::numeric, 89.0591440::numeric),
    ('jashore', 'chanchra-shiva-temple', 23.1444791::numeric, 89.2041487::numeric),
    ('jashore', 'jess-garden-park', 23.1980862::numeric, 89.2111140::numeric),
    ('jashore', 'jessore-collectorate-heritage-area', 23.1669527::numeric, 89.2080040::numeric),
    ('jashore', 'bhairab-river', 23.1670000::numeric, 89.2170000::numeric),
    ('narail', 'sm-sultan-memorial-complex', 23.1581796::numeric, 89.5036114::numeric),
    ('narail', 'chitra-river', 23.1689486::numeric, 89.5105409::numeric),
    ('narail', 'birshreshtha-noor-mohammad-memorial', 23.2112576::numeric, 89.5827956::numeric),
    ('narail', 'victoria-college-heritage-area', 23.1618475::numeric, 89.4989950::numeric),
    ('narail', 'arunima-countryside-area', 23.0746568::numeric, 89.7117402::numeric),
    ('magura', 'raja-sitaram-ray-palace-ruins', 23.4037820::numeric, 89.5955440::numeric),
    ('magura', 'mohammadpur-historic-area', 23.4003334::numeric, 89.5974634::numeric),
    ('magura', 'siddheshwari-math', 23.5050578::numeric, 89.3960572::numeric),
    ('magura', 'nabaganga-river', 23.4926245::numeric, 89.3795386::numeric),
    ('magura', 'atharokhada-archaeological-historic-sites', 23.5053000::numeric, 89.3959000::numeric),
    ('jhenaidah', 'barobazar-archaeological-sites', 23.3027755::numeric, 89.1424508::numeric),
    ('jhenaidah', 'naldanga-temple-complex', 23.4417108::numeric, 89.1653880::numeric),
    ('jhenaidah', 'pagla-kanai-shrine', 23.5249000::numeric, 89.1483000::numeric),
    ('jhenaidah', 'dhol-samudra-dighi', 23.5303921::numeric, 89.1490820::numeric),
    ('jhenaidah', 'k-p-basu-ancestral-house', 23.5635516::numeric, 89.2996454::numeric),
    ('jhenaidah', 'shailkupa-ram-gopal-temple', 23.6850000::numeric, 89.2400000::numeric),
    ('kushtia', 'lalon-shah-shrine', 23.8957891::numeric, 89.1521205::numeric),
    ('kushtia', 'shilaidaha-kuthibari', 23.9197559::numeric, 89.2200005::numeric),
    ('kushtia', 'kangal-harinath-museum', 23.8561320::numeric, 89.2370070::numeric),
    ('kushtia', 'mir-mosharraf-hossain-memorial', 23.8860204::numeric, 89.1734545::numeric),
    ('kushtia', 'gorai-river', 23.9102000::numeric, 89.1540000::numeric),
    ('kushtia', 'tagore-heritage-area', 23.9015774::numeric, 89.1462006::numeric),
    ('kushtia', 'lalon-academy', 23.8959000::numeric, 89.1523000::numeric),
    ('chuadanga', 'karpasdanga-neelkuthi', 23.5763612::numeric, 88.6988569::numeric),
    ('chuadanga', 'kazi-nazrul-memorial-sites-at-karpasdanga', 23.5758429::numeric, 88.7099079::numeric),
    ('chuadanga', 'carew-co-historic-industrial-area-darshana', 23.5307359::numeric, 88.8011552::numeric),
    ('chuadanga', 'darshana-railway-heritage', 23.5264682::numeric, 88.7971289::numeric),
    ('chuadanga', 'mathabhanga-river', 23.6440000::numeric, 88.8440000::numeric),
    ('chuadanga', 'liberation-war-memorial-sites', 23.6382331::numeric, 88.6577317::numeric),
    ('meherpur', 'mujibnagar-memorial-complex', 23.6490270::numeric, 88.5975136::numeric),
    ('meherpur', 'mujibnagar-mango-grove', 23.6500000::numeric, 88.5990000::numeric),
    ('meherpur', 'amjhupi-neelkuthi', 23.7411704::numeric, 88.6781943::numeric),
    ('meherpur', 'bhatpara-neelkuthi', 23.8443465::numeric, 88.7019973::numeric),
    ('meherpur', 'meherpur-historic-sites', 23.7780171::numeric, 88.6324460::numeric),
    ('meherpur', 'bhairab-river', 23.7700775::numeric, 88.6267143::numeric)
) as mapped(district_slug, slug, latitude, longitude)
  on mapped.district_slug = district.slug
where place.district_id = district.id
  and place.slug = mapped.slug;

commit;
