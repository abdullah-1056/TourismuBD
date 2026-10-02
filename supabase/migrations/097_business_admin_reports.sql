-- Extends the report policies from 095/096 to Business Admins.
-- The existing select/update and related-record policies share this helper.
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
        and author.role = 'TRAVELER' and not author.is_admin_only
    )
    when private.current_admin_role() = 'business_admin' then exists (
      select 1 from public.social_posts post
      join public.profiles author on author.id = post.author_id
      where post.id = report_social_post_id
        and report_provider_id is null
        and author.role = 'BUSINESS_OWNER' and not author.is_admin_only
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
