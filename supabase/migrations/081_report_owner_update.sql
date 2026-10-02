-- A member can refine an open report they have already submitted for the same timeline post.
drop policy if exists reports_owner_update on public.reports;
create policy reports_owner_update on public.reports for update to authenticated
using (created_by = auth.uid() and status = 'OPEN')
with check (
  created_by = auth.uid()
  and status = 'OPEN'
  and admin_note is null
  and resolved_by is null
);
