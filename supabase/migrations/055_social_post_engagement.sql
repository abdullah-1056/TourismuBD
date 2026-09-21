create table public.social_post_likes (
  post_id uuid not null references public.social_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.social_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.social_posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index social_post_comments_post_created_at_idx
  on public.social_post_comments (post_id, created_at);

create or replace function private.can_interact_with_social_post(target_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.social_posts post
    join public.profiles actor on actor.id = auth.uid()
    where post.id = target_post_id
      and actor.status = 'ACTIVE'
      and actor.role <> 'SUPER_ADMIN'
      and (
        post.author_id = auth.uid()
        or private.can_view_social_post(post.author_id, post.audience)
      )
  );
$$;

alter table public.social_post_likes enable row level security;
alter table public.social_post_comments enable row level security;

create policy social_post_likes_visible on public.social_post_likes
for select to authenticated
using (private.can_interact_with_social_post(post_id));

create policy social_post_likes_owner_insert on public.social_post_likes
for insert to authenticated
with check (user_id = auth.uid() and private.can_interact_with_social_post(post_id));

create policy social_post_likes_owner_delete on public.social_post_likes
for delete to authenticated
using (user_id = auth.uid());

create policy social_post_comments_visible on public.social_post_comments
for select to authenticated
using (private.can_interact_with_social_post(post_id));

create policy social_post_comments_owner_insert on public.social_post_comments
for insert to authenticated
with check (author_id = auth.uid() and private.can_interact_with_social_post(post_id));

create policy social_post_comments_owner_delete on public.social_post_comments
for delete to authenticated
using (author_id = auth.uid());

create or replace view public.social_post_engagement
with (security_barrier = true, security_invoker = true)
as
select post.id as post_id,
       (select count(*)::integer from public.social_post_likes likes where likes.post_id = post.id) as like_count,
       (select count(*)::integer from public.social_post_comments comments where comments.post_id = post.id) as comment_count,
       exists (
         select 1 from public.social_post_likes own_like
         where own_like.post_id = post.id and own_like.user_id = auth.uid()
       ) as liked_by_me
from public.social_posts post;

revoke all on function private.can_interact_with_social_post(uuid) from public, anon, authenticated;
grant execute on function private.can_interact_with_social_post(uuid) to authenticated;
grant select, insert, delete on public.social_post_likes to authenticated;
grant select, insert, delete on public.social_post_comments to authenticated;
grant select on public.social_post_engagement to authenticated;
