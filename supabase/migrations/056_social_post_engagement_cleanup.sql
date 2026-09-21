alter table public.social_post_likes
  drop constraint if exists social_post_likes_post_id_fkey,
  add constraint social_post_likes_post_id_fkey
    foreign key (post_id) references public.social_posts(id) on delete cascade;

alter table public.social_post_comments
  drop constraint if exists social_post_comments_post_id_fkey,
  add constraint social_post_comments_post_id_fkey
    foreign key (post_id) references public.social_posts(id) on delete cascade;
