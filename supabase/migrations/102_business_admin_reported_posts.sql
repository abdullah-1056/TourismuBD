-- Business Admins may delete a timeline post only when its report is assigned
-- to an existing public business account managed by the business team.
drop policy if exists social_posts_business_admin_report_delete on public.social_posts;
create policy social_posts_business_admin_report_delete on public.social_posts for delete to authenticated
using (
  public.can_access_admin_module('business')
  and exists (
    select 1
    from public.reports report
    join public.social_posts reported_post on reported_post.id = report.social_post_id
    join public.profiles owner on owner.id = reported_post.author_id
    join public.businesses business on business.user_id = owner.id
    where reported_post.id = social_posts.id
      and report.provider_id is null
      and owner.role = 'BUSINESS_OWNER'
      and not owner.is_admin_only
      and public.can_view_report(report.social_post_id, report.provider_id)
  )
);
