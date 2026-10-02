-- Super Admins need read-only access to a reported timeline post in order to investigate it.
drop policy if exists social_posts_super_admin_select on public.social_posts;
create policy social_posts_super_admin_select on public.social_posts for select to authenticated
using (public.is_super_admin());
