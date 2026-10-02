-- Super Admins need to open the reported post attachment while investigating a report.
drop policy if exists social_posts_super_admin_media_read on storage.objects;
create policy social_posts_super_admin_media_read on storage.objects for select to authenticated
using (bucket_id = 'social-posts' and public.is_super_admin());
