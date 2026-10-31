begin;
-- Public pseudonyms; never authentication identities or private preferences.
create policy profiles_directory on public.beer_profiles for select to anon using(true);
alter table public.beer_preferences add column bio text not null default '' check(char_length(bio)<=500);
grant update(bio) on public.beer_preferences to authenticated;
create policy preferences_friends_read on public.beer_preferences for select to authenticated using(exists(
 select 1 from public.beer_friendships f where f.status='accepted' and
 ((f.requester=(select auth.uid()) and f.recipient=user_id) or (f.recipient=(select auth.uid()) and f.requester=user_id))
));
create table public.beer_social_posts(
 id uuid primary key default gen_random_uuid(),user_id uuid not null default auth.uid() references public.beer_profiles(user_id) on delete cascade,
 body text not null check(char_length(trim(body)) between 1 and 2000),place_city text not null default '' check(char_length(place_city)<=80),
 visibility text not null default 'public' check(visibility in('public','friends','private')),created_at timestamptz not null default now()
);
alter table public.beer_social_posts enable row level security;
revoke all on public.beer_social_posts from public,anon,authenticated;
grant select on public.beer_social_posts to anon,authenticated;
grant insert,delete on public.beer_social_posts to authenticated;
create index social_posts_recent on public.beer_social_posts(created_at desc,id);
create index social_posts_author on public.beer_social_posts(user_id,created_at desc);
create index social_posts_city on public.beer_social_posts(lower(place_city),created_at desc);
create policy social_posts_public on public.beer_social_posts for select to anon,authenticated using(visibility='public');
create policy social_posts_personal on public.beer_social_posts for select to authenticated using(user_id=(select auth.uid()) or
 (visibility='friends' and exists(select 1 from public.beer_friendships f where f.status='accepted' and
 ((f.requester=(select auth.uid()) and f.recipient=user_id) or (f.recipient=(select auth.uid()) and f.requester=user_id)))));
create policy social_posts_add on public.beer_social_posts for insert to authenticated with check(user_id=(select auth.uid()));
create policy social_posts_delete on public.beer_social_posts for delete to authenticated using(user_id=(select auth.uid()));
create table public.beer_social_cheers(
 post_id uuid not null references public.beer_social_posts(id) on delete cascade,
 user_id uuid not null default auth.uid() references public.beer_profiles(user_id) on delete cascade,
 created_at timestamptz not null default now(),primary key(post_id,user_id)
);
create index social_cheers_author on public.beer_social_cheers(user_id);
alter table public.beer_social_cheers enable row level security;
revoke all on public.beer_social_cheers from public,anon,authenticated;
grant select on public.beer_social_cheers to anon,authenticated;grant insert,delete on public.beer_social_cheers to authenticated;
create policy social_cheers_read on public.beer_social_cheers for select to anon,authenticated using(exists(select 1 from public.beer_social_posts p where p.id=post_id));
create policy social_cheers_add on public.beer_social_cheers for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.beer_social_posts p where p.id=post_id));
create policy social_cheers_delete on public.beer_social_cheers for delete to authenticated using(user_id=(select auth.uid()));
create table public.beer_social_comments(
 id uuid primary key default gen_random_uuid(),post_id uuid not null references public.beer_social_posts(id) on delete cascade,
 user_id uuid not null default auth.uid() references public.beer_profiles(user_id) on delete cascade,
 body text not null check(char_length(trim(body)) between 1 and 1000),parent_id uuid,created_at timestamptz not null default now(),
 unique(id,post_id),foreign key(parent_id,post_id) references public.beer_social_comments(id,post_id) on delete cascade
);
create index social_comments_post on public.beer_social_comments(post_id,created_at,id);
create index social_comments_parent on public.beer_social_comments(parent_id,post_id);
create index social_comments_author on public.beer_social_comments(user_id);
alter table public.beer_social_comments enable row level security;
revoke all on public.beer_social_comments from public,anon,authenticated;
grant select on public.beer_social_comments to anon,authenticated;grant insert,delete on public.beer_social_comments to authenticated;
create policy social_comments_read on public.beer_social_comments for select to anon,authenticated using(exists(select 1 from public.beer_social_posts p where p.id=post_id));
create policy social_comments_add on public.beer_social_comments for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.beer_social_posts p where p.id=post_id));
create policy social_comments_delete on public.beer_social_comments for delete to authenticated using(user_id=(select auth.uid()));
create view public.beer_social_comment_feed with(security_invoker=true) as select c.*,p.nickname from public.beer_social_comments c join public.beer_profiles p on p.user_id=c.user_id;
grant select on public.beer_social_comment_feed to anon,authenticated;
create view public.beer_social_feed with(security_invoker=true) as
 select f.id,f.user_id,f.created_at,f.place_city,'beer'::text kind,to_jsonb(f)||jsonb_build_object('kind','beer') payload from public.beer_feed f
 union all
 select p.id,p.user_id,p.created_at,p.place_city,'sip'::text kind,to_jsonb(p)||jsonb_build_object('kind','sip','nickname',u.nickname,'selected_tag',u.selected_tag,
 'cheers_count',(select count(*) from public.beer_social_cheers c where c.post_id=p.id),
 'cheered',exists(select 1 from public.beer_social_cheers c where c.post_id=p.id and c.user_id=(select auth.uid())),
 'comments_count',(select count(*) from public.beer_social_comments c where c.post_id=p.id)) payload
 from public.beer_social_posts p join public.beer_profiles u on u.user_id=p.user_id;
grant select on public.beer_social_feed to anon,authenticated;
alter table public.beer_notifications add column social_post_id uuid references public.beer_social_posts(id) on delete cascade;
create index notifications_social_post on public.beer_notifications(social_post_id);
alter table public.beer_notifications drop constraint beer_notifications_check;
alter table public.beer_notifications add constraint beer_notifications_check check((entry_id is not null)::int+(meetup_id is not null)::int+(social_post_id is not null)::int=1);
drop policy notifications_read on public.beer_notifications;
create policy notifications_read on public.beer_notifications for select to authenticated using(recipient_id=(select auth.uid()) and (
 exists(select 1 from public.beer_entries e where e.id=entry_id) or exists(select 1 from public.beer_meetups m where m.id=meetup_id) or exists(select 1 from public.beer_social_posts p where p.id=social_post_id)));
create function private.notify_social_post() returns trigger language plpgsql security definer set search_path='' as $$
declare owner_id uuid; reply_id uuid;
begin
 select user_id into owner_id from public.beer_social_posts where id=new.post_id;
 if TG_TABLE_NAME='beer_social_comments' then
  if new.parent_id is not null then select user_id into reply_id from public.beer_social_comments where id=new.parent_id;end if;
  if owner_id<>new.user_id then insert into public.beer_notifications(recipient_id,actor_id,kind,social_post_id) values(owner_id,new.user_id,case when owner_id=reply_id then 'reply' else 'comment' end,new.post_id);end if;
  if reply_id is not null and reply_id<>new.user_id and reply_id<>owner_id then insert into public.beer_notifications(recipient_id,actor_id,kind,social_post_id) values(reply_id,new.user_id,'reply',new.post_id);end if;
 elsif owner_id<>new.user_id then
  insert into public.beer_notifications(recipient_id,actor_id,kind,social_post_id) values(owner_id,new.user_id,'cheer',new.post_id);
 end if;
 return new;
end $$;
revoke all on function private.notify_social_post() from public,anon,authenticated;
create trigger notify_social_comment after insert on public.beer_social_comments for each row execute function private.notify_social_post();
create trigger notify_social_cheer after insert on public.beer_social_cheers for each row execute function private.notify_social_post();
-- Respect account deletion protection on projects where it is already installed.
do $$begin if to_regprocedure('private.guard_account_write()') is not null then
 create trigger guard_account_write before insert on public.beer_social_posts for each row execute function private.guard_account_write();
 create trigger guard_account_write before insert on public.beer_social_comments for each row execute function private.guard_account_write();
 create trigger guard_account_write before insert on public.beer_social_cheers for each row execute function private.guard_account_write();
end if;end$$;
commit;
