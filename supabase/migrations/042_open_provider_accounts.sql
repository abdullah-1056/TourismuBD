create or replace function public.protect_provider_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_super_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.user_id <> auth.uid() or new.account_status <> 'ACTIVE' or new.public_status <> 'PUBLISHED' then
      raise exception 'New provider accounts must start active and published';
    end if;
  elsif new.user_id is distinct from old.user_id
     or new.type is distinct from old.type
     or new.account_status is distinct from old.account_status
     or new.public_status is distinct from old.public_status then
    raise exception 'Provider account controls are Admin-managed';
  end if;
  return new;
end;
$$;

alter table public.providers alter column account_status set default 'ACTIVE';
alter table public.providers alter column public_status set default 'PUBLISHED';

update public.providers
set account_status = case when account_status = 'PENDING' then 'ACTIVE' else account_status end,
    public_status = case when public_status = 'DRAFT' then 'PUBLISHED' else public_status end
where account_status = 'PENDING' or public_status = 'DRAFT';

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
    where p.id = target_provider_id
      and p.account_status = 'ACTIVE'
      and p.public_status = 'PUBLISHED'
  );
$$;

revoke execute on function public.protect_provider_admin_fields() from public, anon, authenticated;
revoke all on function private.is_provider_discoverable(uuid) from public;
grant execute on function private.is_provider_discoverable(uuid) to anon, authenticated;
