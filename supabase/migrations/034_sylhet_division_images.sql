update public.places
set image_url = case slug
  when 'ratargul-swamp-forest' then '/images/sylhet-division-landscapes.png'
  when 'sreemangal' then '/images/bangladesh-destinations-collage.png'
  when 'rema-kalenga-wildlife-sanctuary' then '/images/reme-kalenga-wildlife.png'
end
where slug in ('ratargul-swamp-forest', 'sreemangal', 'rema-kalenga-wildlife-sanctuary');
