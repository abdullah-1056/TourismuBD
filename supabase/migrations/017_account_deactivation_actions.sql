alter table public.profiles
  add column if not exists deactivated_at timestamptz;

create index if not exists profiles_deactivation_purge_idx
  on public.profiles (deactivated_at)
  where status = 'DEACTIVATED';

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and not public.is_super_admin()
     and (
       new.role is distinct from old.role
       or (
         new.status is distinct from old.status
         and not (
           old.id = auth.uid()
           and current_setting('app.account_status_action', true) = 'deactivate'
           and old.status = 'ACTIVE'
           and new.status = 'DEACTIVATED'
         )
         and not (
           old.id = auth.uid()
           and current_setting('app.account_status_action', true) = 'reactivate'
           and old.status = 'DEACTIVATED'
           and new.status = 'ACTIVE'
         )
       )
     ) then
    raise exception 'Only SUPER_ADMIN may change role or account status';
  end if;

  if old.role = 'SUPER_ADMIN' and old.status = 'ACTIVE'
     and (new.role <> 'SUPER_ADMIN' or new.status <> 'ACTIVE')
     and not exists (
       select 1 from public.profiles
       where id <> old.id and role = 'SUPER_ADMIN' and status = 'ACTIVE'
     ) then
    raise exception 'At least one active SUPER_ADMIN is required';
  end if;
  return new;
end;
$$;

create or replace function public.deactivate_own_account()
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Sign in to deactivate your account'; end if;
  perform set_config('app.account_status_action', 'deactivate', true);
  update public.profiles
  set status = 'DEACTIVATED', deactivated_at = now()
  where id = auth.uid() and status = 'ACTIVE';
  if not found then raise exception 'Only active accounts can be deactivated'; end if;
end;
$$;

create or replace function public.reactivate_own_account()
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Sign in to reactivate your account'; end if;
  perform set_config('app.account_status_action', 'reactivate', true);
  update public.profiles
  set status = 'ACTIVE', deactivated_at = null
  where id = auth.uid() and status = 'DEACTIVATED';
end;
$$;

create or replace function public.purge_deactivated_account(target_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_deactivated_at timestamptz;
begin
  select p.deactivated_at into target_deactivated_at
  from public.profiles p
  where p.id = target_user_id and p.status = 'DEACTIVATED'
  for update;

  if target_deactivated_at is null
     or target_deactivated_at > now() - interval '3 months'
     or exists (
       select 1 from auth.users u
       where u.id = target_user_id and u.last_sign_in_at > target_deactivated_at
     ) then
    return false;
  end if;

  delete from public.reviews
  where traveler_id = target_user_id
     or booking_id in (
       select b.id from public.bookings b
       where b.traveler_id = target_user_id
          or b.provider_id in (select p.id from public.providers p where p.user_id = target_user_id)
     );
  delete from public.reports where created_by = target_user_id;
  delete from public.bookings
  where traveler_id = target_user_id
     or provider_id in (select p.id from public.providers p where p.user_id = target_user_id);
  return true;
end;
$$;

create or replace function private.is_provider_discoverable(target_provider_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.providers p
    join public.profiles u on u.id = p.user_id and u.status = 'ACTIVE'
    join public.provider_verifications v on v.provider_id = p.id and v.status = 'APPROVED'
    join public.provider_subscriptions s on s.provider_id = p.id and s.status = 'ACTIVE'
    where p.id = target_provider_id
      and p.account_status = 'ACTIVE'
      and p.public_status = 'PUBLISHED'
  );
$$;

revoke all on function public.deactivate_own_account() from public, anon;
revoke all on function public.reactivate_own_account() from public, anon;
revoke all on function public.purge_deactivated_account(uuid) from public, anon, authenticated;
grant execute on function public.deactivate_own_account() to authenticated;
grant execute on function public.reactivate_own_account() to authenticated;
grant execute on function public.purge_deactivated_account(uuid) to service_role;
