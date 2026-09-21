create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and not public.is_super_admin()
     and (new.role is distinct from old.role or new.status is distinct from old.status) then
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

create or replace function public.audit_super_admin_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  previous jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  current jsonb := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
begin
  if public.is_super_admin() then
    insert into public.admin_actions (
      admin_user_id, entity_type, entity_id, action, reason, old_data, new_data
    ) values (
      auth.uid(), tg_table_name,
      coalesce(
        (current ->> 'id')::uuid, (previous ->> 'id')::uuid,
        (current ->> 'provider_id')::uuid, (previous ->> 'provider_id')::uuid
      ),
      tg_op, nullif(current_setting('app.admin_reason', true), ''), previous, current
    );
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists audit_water_bodies on public.water_bodies;
create trigger audit_water_bodies after insert or update or delete on public.water_bodies
for each row execute function public.audit_super_admin_change();

drop trigger if exists audit_saved_trips on public.saved_trips;
create trigger audit_saved_trips after insert or update or delete on public.saved_trips
for each row execute function public.audit_super_admin_change();

drop trigger if exists audit_guide_profiles on public.guide_profiles;
create trigger audit_guide_profiles after insert or update or delete on public.guide_profiles
for each row execute function public.audit_super_admin_change();
