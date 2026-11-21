begin;
-- Duplicate beers typed by users (Dan, 21. 11. 2026).
-- 1) Aliases: a typed name that is known to mean an official beer or brewery is rewritten on save,
--    so the wall, the diary and the library only ever show the official name.
-- 2) Cleanup functions for the SQL editor (not callable from the app):
--      select private.merge_beer('Budvar 10','Budvar','Budvar Výčepní','Budějovický Budvar');
--      select private.merge_brewery('Plzeň Prazdroj','Plzeňský Prazdroj');
--    They rename existing entries, move wishes, delete the duplicate library row and remember the alias.
--    Candidates are listed by `npm run duplicity` (scripts/duplicity.mjs).
create function private.name_key(v text) returns text language sql immutable set search_path='' as
 $$select lower(regexp_replace(trim(v),'\s+',' ','g'))$$;

create table private.beer_aliases(
 beer_key text not null,brewery_key text not null,
 catalog_id uuid not null references public.beer_catalog(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(beer_key,brewery_key)
);
create table private.brewery_aliases(
 brewery_key text primary key,brewery text not null check(char_length(trim(brewery)) between 1 and 80),
 created_at timestamptz not null default now()
);
revoke all on private.beer_aliases,private.brewery_aliases from public,anon,authenticated;

create or replace function private.link_beer_catalog() returns trigger
 language plpgsql security definer set search_path='' as $$
declare official public.beer_catalog;
begin
 new.beer := trim(new.beer); new.brewery := trim(new.brewery);
 -- A known duplicate of a whole beer wins over a brewery alias.
 select c.* into official from private.beer_aliases a join public.beer_catalog c on c.id=a.catalog_id
  where a.beer_key=private.name_key(new.beer) and a.brewery_key=private.name_key(new.brewery);
 if found then
  new.beer:=official.beer; new.brewery:=official.brewery; new.style:=official.style;
 else
  new.brewery:=coalesce((select b.brewery from private.brewery_aliases b where b.brewery_key=private.name_key(new.brewery)),new.brewery);
 end if;
 insert into public.beer_catalog(beer,brewery,style) values(new.beer,new.brewery,new.style)
 on conflict(beer_key,brewery_key) do nothing;
 select id into new.catalog_id from public.beer_catalog
 where beer_key=private.name_key(new.beer) and brewery_key=private.name_key(new.brewery);
 return new;
end $$;
revoke all on function private.link_beer_catalog() from public,anon,authenticated;

create function private.merge_beer(old_beer text,old_brewery text,new_beer text,new_brewery text,new_style text default null,new_source text default null)
 returns integer language plpgsql set search_path='' as $$
declare target uuid; old_id uuid; moved integer;
begin
 if private.name_key(old_beer)=private.name_key(new_beer) and private.name_key(old_brewery)=private.name_key(new_brewery) then return 0; end if;
 select id into old_id from public.beer_catalog where beer_key=private.name_key(old_beer) and brewery_key=private.name_key(old_brewery);
 insert into public.beer_catalog(beer,brewery,style,source)
  values(trim(new_beer),trim(new_brewery),coalesce(new_style,(select style from public.beer_catalog where id=old_id),'Jiné'),new_source)
  on conflict(beer_key,brewery_key) do update set source=coalesce(public.beer_catalog.source,excluded.source);
 select id into target from public.beer_catalog where beer_key=private.name_key(new_beer) and brewery_key=private.name_key(new_brewery);
 -- Remember the alias first: the entry update below goes through link_beer_catalog and lands on the target.
 insert into private.beer_aliases(beer_key,brewery_key,catalog_id) values(private.name_key(old_beer),private.name_key(old_brewery),target)
  on conflict(beer_key,brewery_key) do update set catalog_id=excluded.catalog_id;
 if old_id is not null then update private.beer_aliases set catalog_id=target where catalog_id=old_id; end if;
 update public.beer_entries e set beer=c.beer,brewery=c.brewery,style=c.style from public.beer_catalog c
  where c.id=target and ((private.name_key(e.beer)=private.name_key(old_beer) and private.name_key(e.brewery)=private.name_key(old_brewery)) or e.catalog_id=old_id);
 get diagnostics moved=row_count;
 if old_id is not null then
  insert into public.beer_wishlist(user_id,catalog_id,created_at) select user_id,target,created_at from public.beer_wishlist where catalog_id=old_id
   on conflict(user_id,catalog_id) do nothing;
  delete from public.beer_catalog where id=old_id and not exists(select 1 from public.beer_entries where catalog_id=old_id);
 end if;
 return moved;
end $$;

create function private.merge_brewery(old_brewery text,new_brewery text) returns integer
 language plpgsql set search_path='' as $$
declare r record; moved integer:=0;
begin
 if private.name_key(old_brewery)=private.name_key(new_brewery) then return 0; end if;
 insert into private.brewery_aliases(brewery_key,brewery) values(private.name_key(old_brewery),trim(new_brewery))
  on conflict(brewery_key) do update set brewery=excluded.brewery;
 update private.brewery_aliases set brewery=trim(new_brewery) where private.name_key(brewery)=private.name_key(old_brewery);
 for r in select beer,style from public.beer_catalog where brewery_key=private.name_key(old_brewery) loop
  moved:=moved+private.merge_beer(r.beer,old_brewery,r.beer,new_brewery,r.style);
 end loop;
 return moved;
end $$;
revoke all on function private.name_key(text),private.merge_beer(text,text,text,text,text,text),private.merge_brewery(text,text) from public,anon,authenticated;

-- First cleanup, checked against the official presets (src/beer-catalog.json).
select private.merge_brewery('Budvar','Budějovický Budvar');
select private.merge_brewery('Plzeň Prazdroj','Plzeňský Prazdroj');
select private.merge_beer('Budvar 10','Budějovický Budvar','Budvar Výčepní','Budějovický Budvar','Ležák','https://www.budejovickybudvar.cz/sortiment/budweiser-budvar-classic');
select private.merge_beer('Pilsner Urquell','Pilsner Urquell','Pilsner Urquell','Plzeňský Prazdroj','Ležák','https://www.prazdroj.cz/znacka/pilsner-urquell');
select private.merge_beer('Radegast 12 Ryze hořká','Plzeňský Prazdroj','Radegast Ryze hořká 12','Radegast','Ležák','https://www.prazdroj.cz/znacka/radegast');
select private.merge_beer('Radegast 10','Radegast','Radegast Rázná 10','Radegast','Ležák','https://www.prazdroj.cz/znacka/radegast');
commit;
