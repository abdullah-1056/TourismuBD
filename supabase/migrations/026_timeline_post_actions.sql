alter table public.reports
  add column if not exists social_post_id uuid references public.social_posts(id) on delete set null;

create unique index if not exists reports_social_post_reporter_idx
  on public.reports (social_post_id, created_by)
  where social_post_id is not null;

drop policy if exists reports_owner_insert on public.reports;
create policy reports_owner_insert on public.reports for insert to authenticated
with check (
  created_by = auth.uid()
  and status = 'OPEN'
  and admin_note is null
  and resolved_by is null
  and (
    social_post_id is null
    or exists (
      select 1 from public.social_posts
      where id = social_post_id and author_id <> auth.uid()
    )
  )
);

create or replace function private.validate_social_post_edit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.author_id <> auth.uid()
    or new.author_id is distinct from old.author_id
    or new.media_type is distinct from old.media_type
    or new.media_path is distinct from old.media_path
    or new.video_duration_seconds is distinct from old.video_duration_seconds
    or new.audience is distinct from old.audience then
    raise exception 'You can only edit the text of your own timeline update';
  end if;
  return new;
end;
$$;

create trigger validate_social_post_edit
before update on public.social_posts
for each row execute function private.validate_social_post_edit();

create policy social_posts_owner_update on public.social_posts for update to authenticated
using (author_id = auth.uid()) with check (author_id = auth.uid());

revoke all on function private.validate_social_post_edit() from public;
