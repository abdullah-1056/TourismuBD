-- Allow accounts in Activate accounts (unblocked suspended profiles) to be found in people search,
-- while hiding reported posts from user feeds and profile timelines.

alter table public.social_posts
  add column if not exists is_hidden boolean not null default false;

-- Check whether a post has been reported
create or replace function private.is_social_post_reported(target_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.reports report
    where report.social_post_id = target_post_id
      and report.status = 'OPEN'
  );
$$;

revoke all on function private.is_social_post_reported(uuid) from public, anon;
grant execute on function private.is_social_post_reported(uuid) to authenticated;

-- Allow public and members to list IDs of hidden or reported posts so clients can exclude them
create or replace function public.get_reported_social_post_ids()
returns table (post_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select distinct p.id as post_id
  from public.social_posts p
  where coalesce(p.is_hidden, false)
     or exists (
       select 1 from public.reports r
       where r.social_post_id = p.id
         and r.status = 'OPEN'
     );
$$;

revoke all on function public.get_reported_social_post_ids() from public;
grant execute on function public.get_reported_social_post_ids() to anon, authenticated;

-- Allow admins to update post visibility without edit trigger failure
create or replace function private.validate_social_post_edit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (public.is_super_admin() or public.can_access_admin_module('reports') or public.can_access_admin_module('users') or public.can_access_admin_module('providers') or public.can_access_admin_module('business')) then
    return new;
  end if;

  if old.author_id <> auth.uid()
    or new.author_id is distinct from old.author_id
    or new.media_type is distinct from old.media_type
    or new.media_path is distinct from old.media_path
    or new.video_duration_seconds is distinct from old.video_duration_seconds
    or new.audience is distinct from old.audience then
    raise exception 'You can only edit the text of your own timeline update';
  end if;
  return new;
end;
$$;

drop policy if exists social_posts_admin_update on public.social_posts;
create policy social_posts_admin_update on public.social_posts for update to authenticated
using (
  public.is_super_admin()
  or public.can_access_admin_module('reports')
  or public.can_access_admin_module('users')
  or public.can_access_admin_module('providers')
  or public.can_access_admin_module('business')
)
with check (
  public.is_super_admin()
  or public.can_access_admin_module('reports')
  or public.can_access_admin_module('users')
  or public.can_access_admin_module('providers')
  or public.can_access_admin_module('business')
);

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
      and (author.status = 'ACTIVE' or (author.status = 'SUSPENDED' and not coalesce(author.is_blocked, false)))
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
              and (
                (business.account_status = 'ACTIVE' and business.public_status = 'PUBLISHED')
                or (business.account_status = 'REMOVED' and not coalesce(business.is_blocked, false))
              )
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
              and (
                (provider.account_status = 'ACTIVE' and provider.public_status = 'PUBLISHED')
                or (provider.account_status = 'REMOVED' and not coalesce(provider.is_blocked, false))
              )
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

revoke all on function private.can_view_social_post(uuid, public.post_audience) from public, anon;
grant execute on function private.can_view_social_post(uuid, public.post_audience) to authenticated;

drop policy if exists social_posts_visible_to_members on public.social_posts;
create policy social_posts_visible_to_members on public.social_posts for select to authenticated
using (
  not coalesce(is_hidden, false)
  and not private.is_social_post_reported(id)
  and (author_id = auth.uid() or private.can_view_social_post(author_id, audience))
);

drop policy if exists social_posts_member_read on storage.objects;
create policy social_posts_member_read on storage.objects for select to authenticated
using (
  bucket_id = 'social-posts'
  and exists (
    select 1 from public.social_posts
    where media_path = name
      and not coalesce(is_hidden, false)
      and not private.is_social_post_reported(id)
      and (author_id = auth.uid() or private.can_view_social_post(author_id, audience))
  )
);

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
  where (u.status = 'ACTIVE' or (u.status = 'SUSPENDED' and not coalesce(u.is_blocked, false)))
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
          and (
            (provider.account_status = 'ACTIVE' and provider.public_status = 'PUBLISHED')
            or (provider.account_status = 'REMOVED' and not coalesce(provider.is_blocked, false))
          )
      )
    )
    and (
      u.role <> 'BUSINESS_OWNER'
      or exists (
        select 1
        from public.businesses business
        where business.user_id = u.id
          and (
            (business.account_status = 'ACTIVE' and business.public_status = 'PUBLISHED')
            or (business.account_status = 'REMOVED' and not coalesce(business.is_blocked, false))
          )
      )
    )
  group by u.id, p.display_name, p.bio, ratings.average_rating, ratings.rating_count;
$$;

revoke all on function private.list_public_people_with_followers() from public;
grant execute on function private.list_public_people_with_followers() to anon, authenticated;
grant select on public.public_people to anon, authenticated;

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

revoke all on function public.search_public_people(text) from public;
grant execute on function public.search_public_people(text) to anon, authenticated;
