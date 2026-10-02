-- Subscription Admins may review provider reports only when the reported
-- provider has a subscription, and may remove reported posts within that scope.
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
      select 1 from public.social_posts post
      join public.profiles author on author.id = post.author_id
      where post.id = report_social_post_id
        and report_provider_id is null
        and author.role = 'TRAVELER'
        and not author.is_admin_only
    )
    when private.current_admin_role() = 'business_admin' then exists (
      select 1 from public.social_posts post
      join public.profiles author on author.id = post.author_id
      where post.id = report_social_post_id
        and report_provider_id is null
        and author.role = 'BUSINESS_OWNER'
        and not author.is_admin_only
    )
    when private.current_admin_role() = 'subscription_admin' then exists (
      select 1
      from public.providers provider
      join public.provider_subscriptions subscription on subscription.provider_id = provider.id
      where provider.id = report_provider_id
         or exists (
           select 1
           from public.social_posts post
           join public.profiles author on author.id = post.author_id
           where post.id = report_social_post_id
             and post.author_id = provider.user_id
             and not author.is_admin_only
         )
    )
    when private.current_admin_role() = 'provider_admin' then exists (
      select 1 from public.providers provider
      where provider.id = report_provider_id
      union all
      select 1 from public.social_posts post
      join public.profiles author on author.id = post.author_id
      join public.providers provider on provider.user_id = post.author_id
      where post.id = report_social_post_id
        and author.role not in ('TRAVELER', 'BUSINESS_OWNER', 'SUPER_ADMIN')
        and not author.is_admin_only
    )
    else false
  end;
$$;

grant execute on function public.can_view_report(uuid, uuid) to authenticated, service_role;

drop policy if exists social_posts_subscription_admin_report_delete on public.social_posts;
create policy social_posts_subscription_admin_report_delete on public.social_posts for delete to authenticated
using (
  public.can_access_admin_module('subscriptions')
  and exists (
    select 1
    from public.reports report
    where report.social_post_id = social_posts.id
      and public.can_view_report(report.social_post_id, report.provider_id)
  )
);
