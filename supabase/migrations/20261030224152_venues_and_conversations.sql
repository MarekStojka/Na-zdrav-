begin;
-- Preserve old clients while making the three audiences authoritative.
alter table public.beer_entries add column visibility text not null default 'private' check(visibility in('public','friends','private')), add column serving_kind text not null default 'unknown' check(serving_kind in('draft','bottle','unknown'));
update public.beer_entries set visibility=case when is_public then 'public' else 'private' end;
create function private.entry_audience() returns trigger language plpgsql set search_path='' as $$begin
 if TG_OP='INSERT' then
  if new.is_public and new.visibility='private' then new.visibility:='public'; end if;
 elsif new.visibility=old.visibility and new.is_public<>old.is_public then
  new.visibility:=case when new.is_public then 'public' else 'private' end;
 end if;
 new.is_public:=new.visibility='public'; return new;
end$$;
revoke all on function private.entry_audience() from public,anon,authenticated;
create trigger entry_audience before insert or update on public.beer_entries for each row execute function private.entry_audience();
grant update(visibility) on public.beer_entries to authenticated;
create policy entries_friends_read on public.beer_entries for select to authenticated using(visibility='friends' and exists(select 1 from public.beer_friendships f where f.status='accepted' and ((f.requester=(select auth.uid()) and f.recipient=beer_entries.user_id) or (f.recipient=(select auth.uid()) and f.requester=beer_entries.user_id))));
create index entries_friends_recent on public.beer_entries(user_id,created_at desc) where visibility='friends';
drop policy cheers_public_read on public.beer_cheers;
drop policy cheers_own_insert on public.beer_cheers;
create policy cheers_visible on public.beer_cheers for select to anon,authenticated using(exists(select 1 from public.beer_entries e where e.id=entry_id));
create policy cheers_insert on public.beer_cheers for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.beer_entries e where e.id=entry_id));
drop policy beer_photo_read on storage.objects;
create policy beer_photo_read on storage.objects for select to anon,authenticated using(bucket_id='beer-photos' and (split_part(name,'/',1)=(select auth.uid())::text or exists(select 1 from public.beer_entries e where e.photo_path=name)));

create table public.beer_comments(
 id uuid primary key default gen_random_uuid(),entry_id uuid not null references public.beer_entries(id) on delete cascade,
 user_id uuid not null default auth.uid() references public.beer_profiles(user_id) on delete cascade,
 parent_id uuid,body text not null check(char_length(trim(body)) between 1 and 1000),created_at timestamptz not null default now(),
 unique(id,entry_id), foreign key(parent_id,entry_id) references public.beer_comments(id,entry_id) on delete cascade
);
create index comments_entry_time on public.beer_comments(entry_id,created_at,id);
create index comments_parent on public.beer_comments(parent_id,entry_id);
create index comments_author on public.beer_comments(user_id);
alter table public.beer_comments enable row level security;
revoke all on public.beer_comments from anon,authenticated;
grant select on public.beer_comments to anon,authenticated;
grant insert,delete on public.beer_comments to authenticated;
create policy comments_read on public.beer_comments for select to anon,authenticated using(exists(select 1 from public.beer_entries e where e.id=entry_id));
create policy comments_add on public.beer_comments for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.beer_entries e where e.id=entry_id));
create policy comments_delete on public.beer_comments for delete to authenticated using(user_id=(select auth.uid()));
create view public.beer_comment_feed with(security_invoker=true) as select c.*,coalesce(p.nickname,'Pivní objevitel') nickname from public.beer_comments c left join public.beer_profiles p on p.user_id=c.user_id;
grant select on public.beer_comment_feed to anon,authenticated;
create policy profiles_commenters on public.beer_profiles for select to anon using(exists(select 1 from public.beer_comments c where c.user_id=beer_profiles.user_id));
create or replace view public.beer_feed with(security_invoker=true) as
 select e.id,e.user_id,e.catalog_id,e.beer,e.brewery,e.style,e.volume,e.count,e.date,e.rating,e.note,e.place_name,e.place_city,e.created_at,
 coalesce(p.nickname,'Pivní objevitel') nickname,
 (select count(*) from public.beer_cheers c where c.entry_id=e.id) cheers_count,
 exists(select 1 from public.beer_cheers c where c.entry_id=e.id and c.user_id=(select auth.uid())) cheered,
 e.photo_path,p.selected_tag,p.friend_code,e.visibility,e.serving_kind,
 (select count(*) from public.beer_comments c where c.entry_id=e.id) comments_count
 from public.beer_entries e left join public.beer_profiles p on p.user_id=e.user_id where e.visibility<>'private';

alter table public.beer_rsvps add column status text not null default 'accepted' check(status in('accepted','declined'));
grant update(status) on public.beer_rsvps to authenticated;
create policy rsvps_update on public.beer_rsvps for update to authenticated using(user_id=(select auth.uid()) and exists(select 1 from public.beer_meetups m where m.id=meetup_id and m.starts_at>now()-interval '4 hours')) with check(user_id=(select auth.uid()));

-- Notifications contain pointers, never a saved copy of private comment text.
create table public.beer_notifications(
 id uuid primary key default gen_random_uuid(),recipient_id uuid not null references public.beer_profiles(user_id) on delete cascade,
 actor_id uuid not null references public.beer_profiles(user_id) on delete cascade,
 kind text not null check(kind in('cheer','comment','reply','invite','rsvp')),
 entry_id uuid references public.beer_entries(id) on delete cascade,
 comment_id uuid references public.beer_comments(id) on delete cascade,
 meetup_id uuid references public.beer_meetups(id) on delete cascade,
 read_at timestamptz,created_at timestamptz not null default now(),check((entry_id is not null)::int+(meetup_id is not null)::int=1)
);
create index notifications_recipient on public.beer_notifications(recipient_id,created_at desc);
create index notifications_entry on public.beer_notifications(entry_id);
create index notifications_comment on public.beer_notifications(comment_id);
create index notifications_meetup on public.beer_notifications(meetup_id);
create index notifications_actor on public.beer_notifications(actor_id);
alter table public.beer_notifications enable row level security;
revoke all on public.beer_notifications from anon,authenticated;
grant select on public.beer_notifications to authenticated;
grant update(read_at) on public.beer_notifications to authenticated;
create policy notifications_read on public.beer_notifications for select to authenticated using(recipient_id=(select auth.uid()) and (exists(select 1 from public.beer_entries e where e.id=entry_id) or exists(select 1 from public.beer_meetups m where m.id=meetup_id)));
create policy notifications_mark on public.beer_notifications for update to authenticated using(recipient_id=(select auth.uid())) with check(recipient_id=(select auth.uid()));
create function private.notify_beer() returns trigger language plpgsql security definer set search_path='' as $$declare target uuid; reply_owner uuid; begin
 if TG_TABLE_NAME='beer_cheers' then
  select e.user_id into target from public.beer_entries e join public.beer_profiles p on p.user_id=e.user_id where e.id=new.entry_id;
  if target<>new.user_id and exists(select 1 from public.beer_profiles where user_id=new.user_id) then insert into public.beer_notifications(recipient_id,actor_id,kind,entry_id) values(target,new.user_id,'cheer',new.entry_id);end if;
 elsif TG_TABLE_NAME='beer_comments' then
  select e.user_id into target from public.beer_entries e join public.beer_profiles p on p.user_id=e.user_id where e.id=new.entry_id;
  if new.parent_id is not null then select user_id into reply_owner from public.beer_comments where id=new.parent_id;end if;
  if target<>new.user_id then insert into public.beer_notifications(recipient_id,actor_id,kind,entry_id,comment_id) values(target,new.user_id,case when target=reply_owner then 'reply' else 'comment' end,new.entry_id,new.id);end if;
  if reply_owner is not null and reply_owner<>target and reply_owner<>new.user_id then insert into public.beer_notifications(recipient_id,actor_id,kind,entry_id,comment_id) values(reply_owner,new.user_id,'reply',new.entry_id,new.id);end if;
 elsif TG_TABLE_NAME='beer_meetups' then
  insert into public.beer_notifications(recipient_id,actor_id,kind,meetup_id)
  select p.user_id,new.host_id,'invite',new.id from public.beer_profiles p where p.user_id<>new.host_id and (p.user_id=new.invited_id or (new.visibility='friends' and exists(select 1 from public.beer_friendships f where f.status='accepted' and ((f.requester=new.host_id and f.recipient=p.user_id) or (f.recipient=new.host_id and f.requester=p.user_id)))));
 elsif TG_TABLE_NAME='beer_rsvps' then
  if TG_OP='UPDATE' and old.status=new.status then return new;end if;
  select host_id into target from public.beer_meetups where id=new.meetup_id;
  if target<>new.user_id then insert into public.beer_notifications(recipient_id,actor_id,kind,meetup_id) values(target,new.user_id,'rsvp',new.meetup_id);end if;
 end if;return new;end$$;
revoke all on function private.notify_beer() from public,anon,authenticated;
create trigger notify_cheer after insert on public.beer_cheers for each row execute function private.notify_beer();
create trigger notify_comment after insert on public.beer_comments for each row execute function private.notify_beer();
create trigger notify_invite after insert on public.beer_meetups for each row execute function private.notify_beer();
create trigger notify_rsvp after insert or update on public.beer_rsvps for each row execute function private.notify_beer();

-- Venue identities follow the existing exact name/city keys. Wishlists remain private.
create table public.beer_venue_ratings(
 user_id uuid not null default auth.uid() references public.beer_profiles(user_id) on delete cascade,
 name text not null check(char_length(trim(name)) between 1 and 120),city text not null default '' check(char_length(city)<=80),
 name_key text generated always as(lower(trim(name))) stored,city_key text generated always as(lower(trim(city))) stored,
 stars smallint not null check(stars between 1 and 5),created_at timestamptz not null default now(),primary key(user_id,name_key,city_key)
);
alter table public.beer_venue_ratings enable row level security;
revoke all on public.beer_venue_ratings from anon,authenticated;
grant select on public.beer_venue_ratings to anon,authenticated;grant insert,delete on public.beer_venue_ratings to authenticated;grant update(stars) on public.beer_venue_ratings to authenticated;
create policy venue_rating_read on public.beer_venue_ratings for select to anon,authenticated using(true);
create policy venue_rating_add on public.beer_venue_ratings for insert to authenticated with check(user_id=(select auth.uid()));
create policy venue_rating_update on public.beer_venue_ratings for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy venue_rating_remove on public.beer_venue_ratings for delete to authenticated using(user_id=(select auth.uid()));
create index ratings_venue on public.beer_venue_ratings(name_key,city_key);
create table public.beer_venue_wishlist(
 user_id uuid not null default auth.uid() references public.beer_profiles(user_id) on delete cascade,
 name text not null check(char_length(trim(name)) between 1 and 120),city text not null default '' check(char_length(city)<=80),
 name_key text generated always as(lower(trim(name))) stored,city_key text generated always as(lower(trim(city))) stored,
 created_at timestamptz not null default now(),primary key(user_id,name_key,city_key)
);
alter table public.beer_venue_wishlist enable row level security;
revoke all on public.beer_venue_wishlist from anon,authenticated;
grant select,insert,delete on public.beer_venue_wishlist to authenticated;
create policy venue_wish_own on public.beer_venue_wishlist for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create view public.beer_venue_details with(security_invoker=true) as
 with regulars as(select name_key,city_key,count(*) regulars from(select lower(trim(place_name)) name_key,lower(trim(place_city)) city_key,user_id from public.beer_entries where is_public and trim(place_name)<>'' group by 1,2,3 having count(distinct date)>=5) r group by 1,2),
 ratings as(select name_key,city_key,count(*) ratings_count,round(avg(stars),2) rating_average from public.beer_venue_ratings group by 1,2)
 select v.*,coalesce(r.regulars,0) regulars,coalesce(s.ratings_count,0) ratings_count,s.rating_average from public.beer_venues v left join regulars r using(name_key,city_key) left join ratings s using(name_key,city_key);
create view public.beer_venue_beers with(security_invoker=true) as
 select lower(trim(e.place_name)) name_key,lower(trim(e.place_city)) city_key,e.catalog_id,e.beer,e.brewery,e.serving_kind,max(e.date) last_seen
 from public.beer_entries e where e.is_public and trim(e.place_name)<>'' group by 1,2,3,4,5,6;
grant select on public.beer_venue_details,public.beer_venue_beers to anon,authenticated;

-- Future business offers: publication requires a verified venue manager, assigned by the operator.
create table public.beer_venue_managers(user_id uuid not null references public.beer_profiles(user_id) on delete cascade,name_key text not null,city_key text not null,primary key(user_id,name_key,city_key));
alter table public.beer_venue_managers enable row level security;
revoke all on public.beer_venue_managers from anon,authenticated;grant select on public.beer_venue_managers to authenticated;
create policy managers_own on public.beer_venue_managers for select to authenticated using(user_id=(select auth.uid()));
create table public.beer_venue_offers(
 id uuid primary key default gen_random_uuid(),name_key text not null,city_key text not null,
 manager_id uuid not null default auth.uid() references public.beer_profiles(user_id),kind text not null check(kind in('event','coupon','special')),
 title text not null check(char_length(trim(title)) between 1 and 120),description text not null default '' check(char_length(description)<=2000),coupon_code text check(char_length(coupon_code)<=80),
 starts_at timestamptz not null,ends_at timestamptz not null,published boolean not null default false,created_at timestamptz not null default now(),check(ends_at>starts_at)
);
create index offers_venue_dates on public.beer_venue_offers(name_key,city_key,ends_at);
create index offers_manager on public.beer_venue_offers(manager_id);
alter table public.beer_venue_offers enable row level security;
revoke all on public.beer_venue_offers from anon,authenticated;grant select on public.beer_venue_offers to anon,authenticated;grant insert,update,delete on public.beer_venue_offers to authenticated;
create policy offers_public on public.beer_venue_offers for select to anon,authenticated using(published and starts_at<=now() and ends_at>now());
create policy offers_manager on public.beer_venue_offers for all to authenticated using(manager_id=(select auth.uid()) and exists(select 1 from public.beer_venue_managers m where m.user_id=(select auth.uid()) and m.name_key=beer_venue_offers.name_key and m.city_key=beer_venue_offers.city_key)) with check(manager_id=(select auth.uid()) and exists(select 1 from public.beer_venue_managers m where m.user_id=(select auth.uid()) and m.name_key=beer_venue_offers.name_key and m.city_key=beer_venue_offers.city_key));
create or replace function private.sync_beer_achievements() returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); facts jsonb; new_ids jsonb; awards jsonb;
begin
 if uid is null then raise exception 'Sign in required' using errcode='42501';end if;
 select jsonb_build_object(
 'beers',count(distinct catalog_id),'breweries',count(distinct lower(trim(brewery))), 'styles',count(distinct style),
 'places',count(distinct lower(trim(place_name))||chr(9)||lower(trim(place_city))) filter(where trim(place_name)<>''),
 'cities',count(distinct lower(trim(place_city))) filter(where trim(place_city)<>''),
 'rated',count(distinct catalog_id) filter(where rating>0),'notes',count(distinct catalog_id) filter(where trim(note)<>''),
 'photos',count(distinct catalog_id) filter(where photo_path is not null and exists(select 1 from storage.objects o where o.bucket_id='beer-photos' and o.name=e.photo_path)),'days',count(distinct date),'months',count(distinct extract(month from date)),
 'nonalc',count(distinct catalog_id) filter(where style='Nealkoholické'),'publicdays',count(distinct date) filter(where is_public),
 'spring',count(distinct date) filter(where extract(month from date) in(3,4,5)), 'summer',count(distinct date) filter(where extract(month from date) in(6,7,8)),
 'autumn',count(distinct date) filter(where extract(month from date) in(9,10,11)), 'winter',count(distinct date) filter(where extract(month from date) in(12,1,2)),
 'style_lager',count(distinct catalog_id) filter(where style='Ležák'),'style_ipa',count(distinct catalog_id) filter(where style='IPA'),
 'style_pale',count(distinct catalog_id) filter(where style='Pale Ale'),'style_wheat',count(distinct catalog_id) filter(where style='Pšeničné'),
 'style_dark',count(distinct catalog_id) filter(where style='Stout / Porter'),'style_zero',count(distinct catalog_id) filter(where style='Nealkoholické'),
 'style_other',count(distinct catalog_id) filter(where style='Jiné'),'total',coalesce(sum(count),0), 'litres',coalesce(sum(count*volume),0)
 ) into facts from public.beer_entries e where user_id=uid;
 facts:=facts||jsonb_build_object(
 'classic',coalesce((select max(n) from(select count(distinct date) n from public.beer_entries where user_id=uid group by catalog_id) s),0),
 'homebase',coalesce((select max(n) from(select count(distinct date) n from public.beer_entries where user_id=uid and trim(place_name)<>'' group by lower(trim(place_name)),lower(trim(place_city))) s),0),
 'wishes',(select count(*) from public.beer_wishlist where user_id=uid),
 'friends',(select count(*) from public.beer_friendships where status='accepted' and uid in(requester,recipient)),
 'hosted',(select count(distinct (created_at at time zone 'Europe/Prague')::date) from public.beer_meetups where host_id=uid),
 'rsvps',(select count(*) from public.beer_rsvps where user_id=uid and status='accepted'));
 with fresh as(insert into public.beer_achievements(user_id,badge_id) select uid,d.id from public.beer_badge_definitions d where coalesce((facts->>d.metric)::numeric,0)>=d.target on conflict do nothing returning badge_id)
 select coalesce(jsonb_agg(badge_id),'[]'::jsonb) into new_ids from fresh;
 select coalesce(jsonb_agg(jsonb_build_object('badge_id',badge_id,'awarded_at',awarded_at) order by awarded_at,badge_id),'[]'::jsonb) into awards from public.beer_achievements where user_id=uid;
 return jsonb_build_object('facts',facts,'awards',awards,'new',new_ids);
end $$;

commit;
