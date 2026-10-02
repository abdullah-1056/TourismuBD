-- Compatibility repair for existing policies created before migration 093.
-- This function returns only the currently signed-in user's Admin role and is
-- already SECURITY DEFINER, so authenticated Admin sessions may safely execute it.

grant usage on schema private to authenticated;
grant execute on function private.current_admin_role() to authenticated, service_role;
