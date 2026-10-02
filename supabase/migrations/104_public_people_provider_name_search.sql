create or replace function public.search_public_people(search_query text)
returns setof public.public_people
language sql
stable
security definer
set search_path = public
as $$
  select person.*
  from public.public_people person
  join public.profiles profile on profile.id = person.id
  left join public.providers provider on provider.user_id = profile.id
  where nullif(trim(search_query), '') is not null
    and (
      profile.full_name ilike '%' || trim(search_query) || '%'
      or person.full_name ilike '%' || trim(search_query) || '%'
      or provider.display_name ilike '%' || trim(search_query) || '%'
      or provider.service_name ilike '%' || trim(search_query) || '%'
    )
  order by person.full_name
  limit 30;
$$;

revoke all on function public.search_public_people(text) from public, anon;
grant execute on function public.search_public_people(text) to authenticated;
