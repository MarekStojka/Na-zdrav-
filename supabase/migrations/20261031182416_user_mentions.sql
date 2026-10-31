begin;
-- Resolve literal pseudonyms, including spaces and punctuation, without dynamic regexes.
create function public.beer_resolve_mentions(body text) returns table(user_id uuid,nickname text)
language sql stable security invoker set search_path='' as $$
 select p.user_id,p.nickname from public.beer_profiles p where exists(
 select 1 from unnest(string_to_array(left(coalesce(body,''),4000),'@')) with ordinality as t(part,n)
 where n>1 and lower(left(part,char_length(p.nickname)))=lower(p.nickname)
 and (char_length(part)=char_length(p.nickname) or substring(part from char_length(p.nickname)+1 for 1)!~ '[[:alnum:]_]')
 and not exists(select 1 from public.beer_profiles longer where char_length(longer.nickname)>char_length(p.nickname)
 and lower(left(part,char_length(longer.nickname)))=lower(longer.nickname)
 and (char_length(part)=char_length(longer.nickname) or substring(part from char_length(longer.nickname)+1 for 1)!~ '[[:alnum:]_]'))
 ) order by char_length(p.nickname) desc,p.nickname limit 20;
$$;
revoke all on function public.beer_resolve_mentions(text) from public;
grant execute on function public.beer_resolve_mentions(text) to anon,authenticated;
alter table public.beer_notifications drop constraint beer_notifications_kind_check;
alter table public.beer_notifications add constraint beer_notifications_kind_check check(kind in('cheer','comment','reply','invite','rsvp','mention'));
create function private.notify_user_mentions() returns trigger language plpgsql security definer set search_path='' as $$
declare content text; entry uuid; post uuid; author uuid; owner_id uuid; audience text; skip_owner uuid; skip_reply uuid; target record;
begin
 author:=new.user_id;
 if TG_TABLE_NAME='beer_entries' then entry:=new.id;content:=new.note;
 elsif TG_TABLE_NAME='beer_social_posts' then post:=new.id;content:=new.body;
 elsif TG_TABLE_NAME='beer_comments' then
  entry:=new.entry_id;content:=new.body;
  if new.parent_id is not null then select user_id into skip_reply from public.beer_comments where id=new.parent_id;end if;
 else
  post:=new.post_id;content:=new.body;
  if new.parent_id is not null then select user_id into skip_reply from public.beer_social_comments where id=new.parent_id;end if;
 end if;
 if entry is not null then select user_id,visibility into owner_id,audience from public.beer_entries where id=entry;
 else select user_id,visibility into owner_id,audience from public.beer_social_posts where id=post;end if;
 if TG_TABLE_NAME in('beer_comments','beer_social_comments') then skip_owner:=owner_id;end if;
 for target in select * from public.beer_resolve_mentions(content) loop
  if target.user_id=author or target.user_id is not distinct from skip_owner or target.user_id is not distinct from skip_reply then continue;end if;
  if audience='public' or target.user_id=owner_id or (audience='friends' and exists(select 1 from public.beer_friendships f where f.status='accepted' and
   ((f.requester=owner_id and f.recipient=target.user_id) or (f.recipient=owner_id and f.requester=target.user_id)))) then
   insert into public.beer_notifications(recipient_id,actor_id,kind,entry_id,social_post_id) values(target.user_id,author,'mention',entry,post);
  end if;
 end loop;
 return new;
end $$;
revoke all on function private.notify_user_mentions() from public,anon,authenticated;
create trigger zz_notify_mentions after insert on public.beer_entries for each row execute function private.notify_user_mentions();
create trigger zz_notify_mentions after insert on public.beer_comments for each row execute function private.notify_user_mentions();
create trigger zz_notify_mentions after insert on public.beer_social_posts for each row execute function private.notify_user_mentions();
create trigger zz_notify_mentions after insert on public.beer_social_comments for each row execute function private.notify_user_mentions();
commit;
