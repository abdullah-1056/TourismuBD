drop view if exists public.public_people;
drop function if exists private.list_public_people_with_followers();

create function private.list_public_people_with_followers()
returns table (
  id uuid, full_name text, role public.app_role, avatar_url text, bio text, district text,
  email text, phone text, blood_group text, gender text, working_place text, hobby text,
  present_address text, permanent_address text, follower_count integer, followers_visible boolean,
  profile_photo_urls text[], rating_average numeric, rating_count integer
)
language sql stable security definer set search_path = public as $$
  select u.id, coalesce(nullif(p.display_name, ''), u.full_name), u.role, u.avatar_url,
         coalesce(p.bio, u.bio), u.district, u.email, u.phone, u.blood_group, u.gender,
         u.working_place, u.hobby, u.present_address, u.permanent_address,
         count(f.follower_id)::integer, u.followers_visible, u.profile_photo_urls,
         coalesce(ratings.average_rating, 0), coalesce(ratings.rating_count, 0)
  from public.profiles u
  left join public.providers p on p.user_id = u.id
  left join public.profile_follows f on f.following_id = u.id
  left join lateral (
    select round(avg(r.rating)::numeric, 1) as average_rating, count(*)::integer as rating_count
    from public.reviews r
    join public.bookings b on b.id = r.booking_id
    where b.provider_id = p.id and r.status = 'PUBLISHED'
  ) ratings on true
  where u.status = 'ACTIVE' and u.role <> 'SUPER_ADMIN'
  group by u.id, p.display_name, p.bio, ratings.average_rating, ratings.rating_count;
$$;

create view public.public_people with (security_barrier = true, security_invoker = true)
as select * from private.list_public_people_with_followers();

grant usage on schema private to anon, authenticated;
revoke all on function private.list_public_people_with_followers() from public;
grant execute on function private.list_public_people_with_followers() to anon, authenticated;
grant select on public.public_people to anon, authenticated;
