-- Users Admins maintain public traveler accounts only. Admin-only identities
-- must never appear in their user totals or profile list.

drop policy if exists profiles_users_admin_select on public.profiles;
create policy profiles_users_admin_select on public.profiles for select to authenticated
using (
  public.is_super_admin()
  or (
    private.current_admin_role() = 'users_admin'
    and role = 'TRAVELER'
    and not is_admin_only
  )
);

drop policy if exists profiles_users_admin_update on public.profiles;
create policy profiles_users_admin_update on public.profiles for update to authenticated
using (
  public.is_super_admin()
  or (
    private.current_admin_role() = 'users_admin'
    and role = 'TRAVELER'
    and not is_admin_only
  )
)
with check (
  public.is_super_admin()
  or (
    private.current_admin_role() = 'users_admin'
    and role = 'TRAVELER'
    and not is_admin_only
  )
);
