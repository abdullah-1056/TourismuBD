-- RLS policies run as the requesting user. Use the public security-definer
-- access helper instead of directly calling the private role helper.

drop policy if exists profiles_users_admin_select on public.profiles;
create policy profiles_users_admin_select on public.profiles for select to authenticated
using (
  public.is_super_admin()
  or (
    public.can_access_admin_module('users')
    and role = 'TRAVELER'
    and not is_admin_only
  )
);

drop policy if exists profiles_users_admin_update on public.profiles;
create policy profiles_users_admin_update on public.profiles for update to authenticated
using (
  public.is_super_admin()
  or (
    public.can_access_admin_module('users')
    and role = 'TRAVELER'
    and not is_admin_only
  )
)
with check (
  public.is_super_admin()
  or (
    public.can_access_admin_module('users')
    and role = 'TRAVELER'
    and not is_admin_only
  )
);
