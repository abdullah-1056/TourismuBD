-- Allow members of any role (Traveler, Provider, Business Owner) to report
-- timeline posts and reopen or update their own reports.
-- Ensure that reports against timeline posts are visible to Super Admins and
-- any Admin managing the Reports module.

-- 1. Helper function allowing members to report any post they did not author,
-- evaluated as security definer to avoid caller-level RLS recursion.
create or replace function private.can_report_social_post(target_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.social_posts
    where id = target_post_id
      and author_id <> auth.uid()
  );
$$;

revoke all on function private.can_report_social_post(uuid) from public;
grant execute on function private.can_report_social_post(uuid) to authenticated, service_role;

-- 2. Report insert policy: Any member can submit an OPEN report against any other post
drop policy if exists reports_owner_insert on public.reports;
create policy reports_owner_insert on public.reports for insert to authenticated
with check (
  created_by = auth.uid()
  and status = 'OPEN'
  and admin_note is null
  and resolved_by is null
  and (
    social_post_id is null
    or private.can_report_social_post(social_post_id)
  )
);

-- 3. Allow members to reopen or update their own reports for a timeline post
drop policy if exists reports_owner_update on public.reports;
create policy reports_owner_update on public.reports for update to authenticated
using (created_by = auth.uid())
with check (
  created_by = auth.uid()
  and status = 'OPEN'
  and admin_note is null
  and resolved_by is null
);

-- 4. Recreate unique index on reports to only constrain duplicate OPEN reports per member
drop index if exists public.reports_social_post_reporter_idx;
create unique index if not exists reports_social_post_reporter_idx
  on public.reports (social_post_id, created_by)
  where social_post_id is not null and status = 'OPEN';

-- 5. Scope report visibility: Super Admins review all reports; any operational
-- admin managing reports can review timeline post reports against any account.
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
    when private.current_admin_role() in ('users_admin', 'provider_admin', 'business_admin')
      and report_social_post_id is not null then true
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
