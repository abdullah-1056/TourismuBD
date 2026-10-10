-- Fix activated reported post visibility in member timelines and community feeds.
-- Previously, private.is_social_post_reported and public.get_reported_social_post_ids
-- checked whether ANY report record existed for the post, even if resolved.
-- Because report audit records are preserved (with status = 'RESOLVED'),
-- activated posts were permanently hidden by RLS policies and client filters.
-- Now, only posts with active OPEN reports (or is_hidden = true) are hidden.

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
