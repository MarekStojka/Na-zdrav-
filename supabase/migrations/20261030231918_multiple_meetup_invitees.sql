begin;
-- Keep the legacy recipient field for clients already open during deployment.
alter table public.beer_meetups add column invited_ids uuid[] not null default '{}';
update public.beer_meetups set invited_ids=array[invited_id] where invited_id is not null;
alter table public.beer_meetups drop constraint beer_meetups_check;
alter table public.beer_meetups add constraint beer_meetups_invitees_check check(
 array_position(invited_ids,null) is null and not(host_id=any(invited_ids)) and
 ((visibility='private' and cardinality(invited_ids)>0) or
  (visibility<>'private' and cardinality(invited_ids)=0 and invited_id is null))
);
create function private.normalize_meetup_invitees() returns trigger language plpgsql set search_path='' as $$
begin
 new.invited_ids:=array(select distinct id from unnest(new.invited_ids || case when new.invited_id is null then '{}'::uuid[] else array[new.invited_id] end) as t(id) order by id);
 return new;
end $$;
revoke all on function private.normalize_meetup_invitees() from public,anon,authenticated;
create trigger normalize_meetup_invitees before insert on public.beer_meetups for each row execute function private.normalize_meetup_invitees();
drop policy meetups_read on public.beer_meetups;
create policy meetups_read on public.beer_meetups for select to authenticated using(
 host_id=(select auth.uid()) or (select auth.uid())=any(invited_ids) or
 (visibility='friends' and exists(select 1 from public.beer_friendships f where f.status='accepted' and
 ((f.requester=(select auth.uid()) and f.recipient=host_id) or (f.recipient=(select auth.uid()) and f.requester=host_id))))
);
drop policy meetups_add on public.beer_meetups;
create policy meetups_add on public.beer_meetups for insert to authenticated with check(
 host_id=(select auth.uid()) and starts_at>now()-interval '5 minutes' and starts_at<now()+interval '1 year' and
 not exists(select 1 from unnest(invited_ids) as t(invitee) where not exists(
 select 1 from public.beer_friendships f where f.status='accepted' and
 ((f.requester=(select auth.uid()) and f.recipient=t.invitee) or (f.recipient=(select auth.uid()) and f.requester=t.invitee))))
);
create or replace function private.notify_beer() returns trigger language plpgsql security definer set search_path='' as $$declare target uuid; reply_owner uuid; begin
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
  select p.user_id,new.host_id,'invite',new.id from public.beer_profiles p where p.user_id<>new.host_id and (p.user_id=any(new.invited_ids) or (new.visibility='friends' and exists(select 1 from public.beer_friendships f where f.status='accepted' and ((f.requester=new.host_id and f.recipient=p.user_id) or (f.recipient=new.host_id and f.requester=p.user_id)))));
 elsif TG_TABLE_NAME='beer_rsvps' then
  if TG_OP='UPDATE' and old.status=new.status then return new;end if;
  select host_id into target from public.beer_meetups where id=new.meetup_id;
  if target<>new.user_id then insert into public.beer_notifications(recipient_id,actor_id,kind,meetup_id) values(target,new.user_id,'rsvp',new.meetup_id);end if;
 end if;return new;end$$;
revoke all on function private.notify_beer() from public,anon,authenticated;

commit;
