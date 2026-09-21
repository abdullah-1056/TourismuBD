-- Rajshahi Division only; district joins disambiguate shared landscape slugs.
-- Broad landscapes use representative visitor points; routing access stays in app data.
begin;

update public.places as place
set latitude = mapped.latitude,
    longitude = mapped.longitude,
    updated_at = now()
from public.districts as district
join (
  values
    ('rajshahi', 'puthia-temple-complex', 24.3642304::numeric, 88.8371785::numeric),
    ('rajshahi', 'puthia-rajbari', 24.3616756::numeric, 88.8364576::numeric),
    ('rajshahi', 'varendra-research-museum', 24.3670593::numeric, 88.5924937::numeric),
    ('rajshahi', 'bagha-mosque', 24.1960601::numeric, 88.8394571::numeric),
    ('rajshahi', 'padma-riverfront', 24.3617632::numeric, 88.5989775::numeric),
    ('rajshahi', 't-band', 24.3613360::numeric, 88.5700149::numeric),
    ('rajshahi', 'rajshahi-university-campus', 24.3681941::numeric, 88.6376358::numeric),
    ('rajshahi', 'shah-makhdum-shrine', 24.3630560::numeric, 88.5947220::numeric),
    ('rajshahi', 'charghat-river-area', 24.2818993::numeric, 88.7506473::numeric),
    ('rajshahi', 'mango-orchards', 24.4810000::numeric, 88.4010000::numeric),
    ('bogura', 'mahasthangarh', 24.9569056::numeric, 89.3484583::numeric),
    ('bogura', 'gokul-medh', 24.9357790::numeric, 89.3364273::numeric),
    ('bogura', 'vasu-vihara', 24.9826813::numeric, 89.2974155::numeric),
    ('bogura', 'mahasthan-archaeological-museum', 24.9611110::numeric, 89.3427780::numeric),
    ('bogura', 'govinda-bhita', 24.9628104::numeric, 89.3457888::numeric),
    ('bogura', 'khodar-pathar-bhita', 24.9506750::numeric, 89.3475694::numeric),
    ('bogura', 'parshuram-palace-site', 24.9550722::numeric, 89.3469750::numeric),
    ('bogura', 'karatoya-river', 24.9618000::numeric, 89.3471000::numeric),
    ('naogaon', 'somapura-mahavihara-paharpur', 25.0314498::numeric, 88.9780875::numeric),
    ('naogaon', 'paharpur-museum', 25.0310384::numeric, 88.9806006::numeric),
    ('naogaon', 'kusumba-mosque', 24.7557248::numeric, 88.6867454::numeric),
    ('naogaon', 'jagaddala-mahavihara', 25.1589905::numeric, 88.8876040::numeric),
    ('naogaon', 'altadighi-national-park', 25.1792597::numeric, 88.8639842::numeric),
    ('naogaon', 'dubalhati-rajbari', 24.7865380::numeric, 88.8831670::numeric),
    ('naogaon', 'balihar-rajbari', 24.8445742::numeric, 88.8059076::numeric),
    ('natore', 'natore-rajbari', 24.4200054::numeric, 88.9915369::numeric),
    ('natore', 'rani-bhabani-palace', 24.4198080::numeric, 88.9918750::numeric),
    ('natore', 'uttara-ganabhaban', 24.4408500::numeric, 89.0102110::numeric),
    ('natore', 'chalan-beel', 24.3682397::numeric, 89.2791870::numeric),
    ('natore', 'dayarampur-rajbari', 24.2799817::numeric, 89.0138254::numeric),
    ('natore', 'halti-beel', 24.5136253::numeric, 89.0326023::numeric),
    ('natore', 'dighapatia-rajbari', 24.4405000::numeric, 89.0110000::numeric),
    ('chapainawabganj', 'choto-sona-mosque', 24.8136850::numeric, 88.1432410::numeric),
    ('chapainawabganj', 'tahkhana-complex', 24.8177336::numeric, 88.1396186::numeric),
    ('chapainawabganj', 'darasbari-mosque', 24.8324965::numeric, 88.1364355::numeric),
    ('chapainawabganj', 'darasbari-madrasa', 24.8335333::numeric, 88.1382472::numeric),
    ('chapainawabganj', 'khania-dighi-mosque', 24.8392857::numeric, 88.1481806::numeric),
    ('chapainawabganj', 'shah-niamatullah-shrine', 24.8184875::numeric, 88.1395055::numeric),
    ('chapainawabganj', 'kotwali-darwaza', 24.8426000::numeric, 88.1412000::numeric),
    ('chapainawabganj', 'mango-orchards', 24.7321859::numeric, 88.1678849::numeric),
    ('chapainawabganj', 'mahananda-river', 24.5880000::numeric, 88.2630000::numeric),
    ('pabna', 'hardinge-bridge', 24.0678870::numeric, 89.0298780::numeric),
    ('pabna', 'lalon-shah-bridge', 24.0654848::numeric, 89.0304300::numeric),
    ('pabna', 'pakshi', 24.0708770::numeric, 89.0406856::numeric),
    ('pabna', 'jor-bangla-temple', 24.0015000::numeric, 89.2450170::numeric),
    ('pabna', 'hemayetpur-satsang-ashram', 23.9988077::numeric, 89.2059584::numeric),
    ('pabna', 'chalan-beel', 24.3008000::numeric, 89.3307000::numeric),
    ('pabna', 'padma-river', 23.9890000::numeric, 89.1970000::numeric),
    ('pabna', 'pakshi-railway-heritage-area', 24.0704094::numeric, 89.0388379::numeric),
    ('sirajganj', 'rabindranath-tagore-kacharibari-shahjadpur', 24.1753745::numeric, 89.5941103::numeric),
    ('sirajganj', 'hatikumrul-navaratna-temple', 24.4329210::numeric, 89.5529320::numeric),
    ('sirajganj', 'jamuna-river', 24.4449017::numeric, 89.7274795::numeric),
    ('sirajganj', 'bangabandhu-bridge-riverfront', 24.3995719::numeric, 89.7749722::numeric),
    ('sirajganj', 'chalan-beel', 24.3750000::numeric, 89.3590000::numeric),
    ('sirajganj', 'shahjadpur-heritage-area', 24.1740000::numeric, 89.5955000::numeric),
    ('joypurhat', 'lakma-rajbari', 25.2050000::numeric, 88.9500000::numeric),
    ('joypurhat', 'achranga-dighi', 25.0018998::numeric, 89.0668055::numeric),
    ('joypurhat', 'nandail-dighi', 25.0615633::numeric, 89.2104613::numeric),
    ('joypurhat', 'hinda-kasba-shahi-mosque', 24.9970951::numeric, 89.1356421::numeric),
    ('joypurhat', 'pagla-dewan-killing-field-memorial', 25.1496882::numeric, 88.9205716::numeric),
    ('joypurhat', 'panchbibi-historical-area', 25.1872769::numeric, 89.0196664::numeric)
) as mapped(district_slug, slug, latitude, longitude)
  on mapped.district_slug = district.slug
where place.district_id = district.id
  and place.slug = mapped.slug;

commit;
