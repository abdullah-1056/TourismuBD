alter table public.profiles
  add column if not exists phone_edit_count integer not null default 0 check (phone_edit_count between 0 and 3),
  add column if not exists email_edit_count integer not null default 0 check (email_edit_count between 0 and 3);

create or replace function public.limit_profile_contact_edits()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.phone is distinct from old.phone then
    if nullif(btrim(coalesce(new.phone, '')), '') is null then raise exception 'Phone number is required'; end if;
    if old.phone_edit_count >= 3 then raise exception 'Phone number can only be changed three times'; end if;
    new.phone_edit_count := old.phone_edit_count + 1;
  elsif new.phone_edit_count is distinct from old.phone_edit_count then
    raise exception 'Phone edit count is managed automatically';
  end if;

  if new.email is distinct from old.email then
    if nullif(btrim(coalesce(new.email, '')), '') is null then raise exception 'Email is required'; end if;
    if old.email_edit_count >= 3 then raise exception 'Email can only be changed three times'; end if;
    new.email_edit_count := old.email_edit_count + 1;
  elsif new.email_edit_count is distinct from old.email_edit_count then
    raise exception 'Email edit count is managed automatically';
  end if;
  return new;
end;
$$;

drop trigger if exists limit_profile_contact_edits on public.profiles;
create trigger limit_profile_contact_edits
before update of phone, email, phone_edit_count, email_edit_count on public.profiles
for each row execute function public.limit_profile_contact_edits();
