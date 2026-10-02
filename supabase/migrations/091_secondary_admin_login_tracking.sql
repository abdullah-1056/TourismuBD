-- Secondary Admin login tracking.
--
-- public.admin_accounts is the source of truth for a Secondary Admin's email,
-- assigned role, active state, and linked Supabase Auth identity. Passwords are
-- intentionally never copied into this table: Supabase Auth stores only a
-- protected password hash in auth.users.

alter table public.admin_accounts
  add column if not exists invitation_sent_at timestamptz;

comment on table public.admin_accounts is
  'Secondary Admin email, role, access state, and linked Supabase Auth identity. Passwords remain managed by Supabase Auth and are never stored here.';
comment on column public.admin_accounts.user_id is
  'The linked Supabase Auth user/profile identity. It is null until the invited Admin sets up their account.';
comment on column public.admin_accounts.invitation_sent_at is
  'Most recent time an Admin invitation or setup link was issued.';

create or replace function public.mark_secondary_admin_invitation_sent(admin_account_id uuid)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
begin
  perform private.require_super_admin_management();

  update public.admin_accounts
  set invitation_sent_at = now(), updated_at = now()
  where id = admin_account_id;

  if not found then
    raise exception 'Secondary Admin account not found';
  end if;
end;
$$;

create or replace function public.list_secondary_admin_login_status()
returns table (
  admin_account_id uuid,
  email text,
  role text,
  is_active boolean,
  auth_user_id uuid,
  credential_status text,
  invitation_sent_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, private
as $$
begin
  perform private.require_super_admin_management();

  return query
  select
    account.id,
    account.email,
    account.role,
    account.is_active,
    account.user_id,
    case
      when not account.is_active then 'DISABLED'
      when account.user_id is null then 'PENDING_PASSWORD_SETUP'
      else 'READY'
    end,
    account.invitation_sent_at,
    account.updated_at
  from public.admin_accounts account
  order by account.updated_at desc, account.email;
end;
$$;

revoke execute on function public.mark_secondary_admin_invitation_sent(uuid) from public, anon;
revoke execute on function public.list_secondary_admin_login_status() from public, anon;
grant execute on function public.mark_secondary_admin_invitation_sent(uuid) to authenticated, service_role;
grant execute on function public.list_secondary_admin_login_status() to authenticated, service_role;
