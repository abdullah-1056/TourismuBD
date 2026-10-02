-- Super Admins can remove a reported timeline post after investigation.
drop policy if exists social_posts_super_admin_delete on public.social_posts;
create policy social_posts_super_admin_delete on public.social_posts for delete to authenticated
using (public.is_super_admin());
