alter table public.social_posts
  add column if not exists product_name text;

alter table public.social_posts
  add constraint social_posts_product_name_length
  check (product_name is null or char_length(btrim(product_name)) between 2 and 140);

create or replace function private.validate_business_post_product_name()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  author_role public.app_role;
begin
  select role into author_role from public.profiles where id = new.author_id;
  if author_role = 'BUSINESS_OWNER' then
    if nullif(btrim(new.product_name), '') is null then
      raise exception 'Business posts need a product name';
    end if;
  elsif new.product_name is not null then
    raise exception 'Only business accounts can name a product post';
  end if;
  return new;
end;
$$;

create trigger validate_business_post_product_name
before insert or update of product_name, author_id on public.social_posts
for each row execute function private.validate_business_post_product_name();

revoke execute on function private.validate_business_post_product_name() from public, anon, authenticated;
