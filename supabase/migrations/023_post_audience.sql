do $$ begin
  create type public.post_audience as enum ('PUBLIC', 'FOLLOWERS');
exception when duplicate_object then null;
end $$;

alter table public.profiles
  add column if not exists post_audience public.post_audience not null default 'PUBLIC';

alter table public.social_posts
  add column if not exists audience public.post_audience not null default 'PUBLIC';

drop policy if exists social_posts_visible_to_members on public.social_posts;
drop policy if exists social_posts_member_read on storage.objects;
drop function if exists private.can_view_social_post(uuid);

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
