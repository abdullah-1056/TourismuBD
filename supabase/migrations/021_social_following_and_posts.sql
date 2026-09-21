create type public.social_media_type as enum ('IMAGE', 'VIDEO');

create table public.profile_follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index profile_follows_following_created_at_idx on public.profile_follows (following_id, created_at desc);

create or replace function private.validate_profile_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.follower_id <> auth.uid() or not exists (
    select 1 from public.profiles
    where id = new.following_id and status = 'ACTIVE' and role <> 'SUPER_ADMIN'
  ) then
    raise exception 'You can only follow active traveler and provider accounts';
  end if;
  return new;
end;
$$;

create trigger validate_profile_follow
before insert on public.profile_follows
for each row execute function private.validate_profile_follow();

create table public.social_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(btrim(body)) between 1 and 2000),
  media_type public.social_media_type not null,
  media_path text not null,
  video_duration_seconds integer,
  created_at timestamptz not null default now(),
  check (
    (media_type = 'IMAGE' and video_duration_seconds is null)
    or (media_type = 'VIDEO' and video_duration_seconds between 30 and 300)
  )
);

create index social_posts_created_at_idx on public.social_posts (created_at desc);
create index social_posts_author_created_at_idx on public.social_posts (author_id, created_at desc);

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
  return new;
end;
$$;

create trigger validate_social_post
before insert on public.social_posts
for each row execute function private.validate_social_post();

create or replace function private.can_view_social_post(target_author_id uuid)
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
        author.role <> 'TRAVELER'
        or exists (
          select 1 from public.profiles viewer
          where viewer.id = auth.uid()
            and viewer.status = 'ACTIVE'
            and viewer.role not in ('TRAVELER', 'SUPER_ADMIN')
        )
      )
  );
$$;

alter table public.profile_follows enable row level security;
alter table public.social_posts enable row level security;

create policy profile_follows_owner_select on public.profile_follows for select to authenticated
using (follower_id = auth.uid());
create policy profile_follows_owner_insert on public.profile_follows for insert to authenticated
with check (follower_id = auth.uid());
create policy profile_follows_owner_delete on public.profile_follows for delete to authenticated
using (follower_id = auth.uid());

create policy social_posts_visible_to_members on public.social_posts for select to authenticated
using (author_id = auth.uid() or private.can_view_social_post(author_id));
create policy social_posts_owner_insert on public.social_posts for insert to authenticated
with check (author_id = auth.uid());
create policy social_posts_owner_delete on public.social_posts for delete to authenticated
using (author_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('social-posts', 'social-posts', false, 104857600, array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'])
on conflict (id) do update
set public = false,
    file_size_limit = 104857600,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];

create policy social_posts_member_read on storage.objects for select to authenticated
using (
  bucket_id = 'social-posts'
  and exists (
    select 1 from public.social_posts
    where media_path = name
      and (author_id = auth.uid() or private.can_view_social_post(author_id))
  )
);
create policy social_posts_owner_insert on storage.objects for insert to authenticated
with check (bucket_id = 'social-posts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy social_posts_owner_update on storage.objects for update to authenticated
using (bucket_id = 'social-posts' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'social-posts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy social_posts_owner_delete on storage.objects for delete to authenticated
using (bucket_id = 'social-posts' and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function private.list_public_people_with_followers()
returns table (
  id uuid,
  full_name text,
  role public.app_role,
  avatar_url text,
  bio text,
  email text,
  phone text,
  blood_group text,
  gender text,
  working_place text,
  hobby text,
  present_address text,
  permanent_address text,
  follower_count integer
)
language sql
stable
security definer
set search_path = public
as $$
  select u.id, coalesce(nullif(p.display_name, ''), u.full_name), u.role,
         u.avatar_url, coalesce(p.bio, u.bio), u.email, u.phone,
         u.blood_group, u.gender, u.working_place, u.hobby,
         u.present_address, u.permanent_address, count(f.follower_id)::integer
  from public.profiles u
  left join public.providers p on p.user_id = u.id
  left join public.profile_follows f on f.following_id = u.id
  where u.status = 'ACTIVE' and u.role <> 'SUPER_ADMIN'
  group by u.id, p.display_name, p.bio;
$$;

create or replace view public.public_people
with (security_barrier = true, security_invoker = true)
as select * from private.list_public_people_with_followers();

grant usage on schema private to anon, authenticated;
revoke all on function private.validate_social_post() from public;
revoke all on function private.validate_profile_follow() from public;
revoke all on function private.can_view_social_post(uuid) from public;
revoke all on function private.list_public_people_with_followers() from public;
grant execute on function private.validate_social_post() to authenticated;
grant execute on function private.validate_profile_follow() to authenticated;
grant execute on function private.can_view_social_post(uuid) to authenticated;
grant execute on function private.list_public_people_with_followers() to anon, authenticated;
grant select on public.public_people to anon, authenticated;
