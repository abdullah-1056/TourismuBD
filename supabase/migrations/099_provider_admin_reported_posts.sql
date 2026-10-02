-- Provider Admins may remove a timeline post only when its report is assigned
-- to the provider team. Report visibility remains the source of scope.
drop policy if exists social_posts_provider_admin_report_delete on public.social_posts;
create policy social_posts_provider_admin_report_delete on public.social_posts for delete to authenticated
using (
  public.can_access_admin_module('providers')
  and exists (
    select 1
    from public.reports report
    where report.social_post_id = social_posts.id
      and public.can_view_report(report.social_post_id, report.provider_id)
  )
);
