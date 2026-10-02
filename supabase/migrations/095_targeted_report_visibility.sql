-- Reports are assigned to the Admin responsible for the reported account.
-- Super Admins may review every report. User and Provider Admins may review
-- only reports against public traveler and provider accounts respectively.

create or replace function public.can_view_report(
  report_social_post_id uuid,
  report_provider_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select case
    when private.current_admin_role() = 'super_admin' then true
    when private.current_admin_role() = 'users_admin' then exists (
      select 1
      from public.social_posts post
      join public.profiles author on author.id = post.author_id
      where post.id = report_social_post_id
        and report_provider_id is null
        and author.role = 'TRAVELER'
        and not author.is_admin_only
    )
    when private.current_admin_role() = 'provider_admin' then exists (
      select 1
      from public.providers provider
      where provider.id = report_provider_id
      union all
      select 1
      from public.social_posts post
      join public.profiles author on author.id = post.author_id
      join public.providers provider on provider.user_id = post.author_id
      where post.id = report_social_post_id
        and author.role <> 'TRAVELER'
        and not author.is_admin_only
    )
    else false
  end;
$$;

grant execute on function public.can_view_report(uuid, uuid) to authenticated, service_role;

drop policy if exists reports_secondary_admin_select on public.reports;
drop policy if exists reports_targeted_admin_select on public.reports;
create policy reports_targeted_admin_select on public.reports for select to authenticated
using (public.can_view_report(social_post_id, provider_id));

drop policy if exists social_posts_reports_admin_select on public.social_posts;
drop policy if exists social_posts_targeted_reports_admin_select on public.social_posts;
create policy social_posts_targeted_reports_admin_select on public.social_posts for select to authenticated
using (exists (
  select 1
  from public.reports report
  where report.social_post_id = social_posts.id
    and public.can_view_report(report.social_post_id, report.provider_id)
));

drop policy if exists profiles_reports_admin_select on public.profiles;
drop policy if exists profiles_targeted_reports_admin_select on public.profiles;
create policy profiles_targeted_reports_admin_select on public.profiles for select to authenticated
using (exists (
  select 1
  from public.reports report
  join public.social_posts post on post.id = report.social_post_id
  where post.author_id = profiles.id
    and public.can_view_report(report.social_post_id, report.provider_id)
));

drop policy if exists social_post_media_reports_admin_select on storage.objects;
drop policy if exists social_post_media_targeted_reports_admin_select on storage.objects;
create policy social_post_media_targeted_reports_admin_select on storage.objects for select to authenticated
using (
  bucket_id = 'social-posts'
  and exists (
    select 1
    from public.social_posts post
    join public.reports report on report.social_post_id = post.id
    where post.media_path = name
      and public.can_view_report(report.social_post_id, report.provider_id)
  )
);
