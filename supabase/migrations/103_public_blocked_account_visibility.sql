-- Keep blocked provider and business accounts out of public discovery while
-- leaving their Auth identities, login access, and historical data intact.

create or replace function private.can_view_social_post(
  target_author_id uuid,
  target_audience public.post_audience
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles author
    where author.id = target_author_id
      and author.status = 'ACTIVE'
      and author.role <> 'SUPER_ADMIN'
      and not author.is_admin_only
      and (
        author.role = 'TRAVELER'
        or (
          author.role = 'BUSINESS_OWNER'
          and exists (
            select 1
            from public.businesses business
            where business.user_id = author.id
              and business.account_status = 'ACTIVE'
              and business.public_status = 'PUBLISHED'
          )
        )
        or (
          author.role in (
            'TOUR_GUIDE', 'HOUSEBOAT_OWNER', 'SMALL_BOAT_OWNER',
            'RESORT_HOTEL_OWNER', 'CAR_TRANSPORT_OWNER', 'PARKING_OWNER', 'TOUR_AGENCY'
          )
          and exists (
            select 1
            from public.providers provider
            where provider.user_id = author.id
              and provider.account_status = 'ACTIVE'
              and provider.public_status = 'PUBLISHED'
          )
        )
      )
      and (
        target_audience = 'PUBLIC'
        or exists (
          select 1
          from public.profiles viewer
          where viewer.id = auth.uid()
            and viewer.status = 'ACTIVE'
            and viewer.role not in ('TRAVELER', 'SUPER_ADMIN')
        )
        or exists (
          select 1
          from public.profile_follows
          where follower_id = auth.uid()
            and following_id = target_author_id
        )
      )
  );
$$;

create or replace function private.list_public_people_with_followers()
returns table (
  id uuid, full_name text, role public.app_role, avatar_url text, bio text, district text,
  email text, phone text, blood_group text, gender text, working_place text, hobby text,
  present_address text, permanent_address text, follower_count integer, followers_visible boolean,
  profile_photo_urls text[], rating_average numeric, rating_count integer
)
language sql
stable
security definer
set search_path = public
as $$
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
  where u.status = 'ACTIVE'
    and u.role <> 'SUPER_ADMIN'
    and not u.is_admin_only
    and (
      u.role not in (
        'TOUR_GUIDE', 'HOUSEBOAT_OWNER', 'SMALL_BOAT_OWNER',
        'RESORT_HOTEL_OWNER', 'CAR_TRANSPORT_OWNER', 'PARKING_OWNER', 'TOUR_AGENCY'
      )
      or exists (
        select 1
        from public.providers provider
        where provider.user_id = u.id
          and provider.account_status = 'ACTIVE'
          and provider.public_status = 'PUBLISHED'
      )
    )
    and (
      u.role <> 'BUSINESS_OWNER'
      or exists (
        select 1
        from public.businesses business
        where business.user_id = u.id
          and business.account_status = 'ACTIVE'
          and business.public_status = 'PUBLISHED'
      )
    )
  group by u.id, p.display_name, p.bio, ratings.average_rating, ratings.rating_count;
$$;

revoke all on function private.can_view_social_post(uuid, public.post_audience) from public, anon;
grant execute on function private.can_view_social_post(uuid, public.post_audience) to authenticated;
revoke all on function private.list_public_people_with_followers() from public, anon;
grant execute on function private.list_public_people_with_followers() to authenticated;
