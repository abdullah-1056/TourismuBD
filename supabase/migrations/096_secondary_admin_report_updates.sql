-- Users and Provider Admins may update only the reports assigned to their
-- account type. Deleting reports and broader account administration remain
-- Super Admin operations.

drop policy if exists reports_targeted_admin_update on public.reports;
create policy reports_targeted_admin_update on public.reports for update to authenticated
using (public.can_view_report(social_post_id, provider_id))
with check (public.can_view_report(social_post_id, provider_id));
