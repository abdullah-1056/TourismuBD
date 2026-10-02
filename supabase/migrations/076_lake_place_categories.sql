-- Keep the Lake filter complete for every existing and newly imported destination.
update public.places
set category = 'Lake'
where name ilike '%Lake%'
  and category is distinct from 'Lake';
