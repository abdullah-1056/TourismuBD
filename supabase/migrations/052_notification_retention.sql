create or replace function private.keep_latest_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.notifications
  where id in (
    select id
    from public.notifications
    where recipient_id = new.recipient_id
    order by created_at desc, id desc
    offset 10
  );
  return new;
end;
$$;

drop trigger if exists keep_latest_notifications on public.notifications;
create trigger keep_latest_notifications
after insert on public.notifications
for each row execute function private.keep_latest_notifications();

with ranked_notifications as (
  select id, row_number() over (partition by recipient_id order by created_at desc, id desc) as position
  from public.notifications
)
delete from public.notifications notification
using ranked_notifications ranked
where notification.id = ranked.id
  and ranked.position > 10;

revoke all on function private.keep_latest_notifications() from public, anon, authenticated;
