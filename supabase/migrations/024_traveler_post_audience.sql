update public.social_posts post
set audience = 'PUBLIC'
from public.profiles author
where author.id = post.author_id and author.role <> 'TRAVELER';

create or replace function private.validate_social_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  author_role public.app_role;
  author_status public.account_status;
begin
  select role, status into author_role, author_status from public.profiles where id = new.author_id;
  if new.author_id <> auth.uid() or author_role is null or author_role = 'SUPER_ADMIN' or author_status <> 'ACTIVE' then
    raise exception 'Only active traveler and provider accounts can publish posts';
  end if;
  if author_role <> 'TRAVELER' then new.audience := 'PUBLIC'; end if;
  return new;
end;
$$;

drop policy if exists social_posts_visible_to_members on public.social_posts;
drop policy if exists social_posts_member_read on storage.objects;
drop function if exists private.can_view_social_post(uuid, public.post_audience);

create function private.can_view_social_post(target_author_id uuid, target_audience public.post_audience)
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
      and (
        target_audience = 'PUBLIC'
        or exists (
          select 1 from public.profiles viewer
          where viewer.id = auth.uid()
            and viewer.status = 'ACTIVE'
            and viewer.role not in ('TRAVELER', 'SUPER_ADMIN')
        )
        or exists (
          select 1 from public.profile_follows
          where follower_id = auth.uid() and following_id = target_author_id
        )
      )
  );
$$;

create policy social_posts_visible_to_members on public.social_posts for select to authenticated
using (author_id = auth.uid() or private.can_view_social_post(author_id, audience));

create policy social_posts_member_read on storage.objects for select to authenticated
using (
  bucket_id = 'social-posts'
  and exists (
    select 1 from public.social_posts
    where media_path = name
      and (author_id = auth.uid() or private.can_view_social_post(author_id, audience))
  )
);

revoke all on function private.can_view_social_post(uuid, public.post_audience) from public;
