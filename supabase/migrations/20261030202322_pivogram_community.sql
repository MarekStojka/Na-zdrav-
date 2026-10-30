begin;
create schema if not exists private;
revoke all on schema private from public,anon,authenticated;
create table public.beer_catalog (
 id uuid primary key default gen_random_uuid(),
 beer text not null check(char_length(trim(beer)) between 1 and 80),
 brewery text not null check(char_length(trim(brewery)) between 1 and 80),
 style text not null check(style in ('Ležák','IPA','Pale Ale','Pšeničné','Stout / Porter','Nealkoholické','Jiné')),
 beer_key text generated always as(lower(regexp_replace(trim(beer),'\s+',' ','g'))) stored,
 brewery_key text generated always as(lower(regexp_replace(trim(brewery),'\s+',' ','g'))) stored,
 source text,
 created_at timestamptz not null default now(),
 unique(beer_key,brewery_key)
);
alter table public.beer_catalog enable row level security;
revoke all on public.beer_catalog from anon,authenticated;
grant select on public.beer_catalog to anon,authenticated;
create policy catalog_read on public.beer_catalog for select to anon,authenticated using(true);
alter table public.beer_entries
 add column catalog_id uuid references public.beer_catalog(id),
 add column place_name text not null default '' check(char_length(place_name)<=120),
 add column place_city text not null default '' check(char_length(place_city)<=80),
 add column is_public boolean not null default false;
create index beer_entries_catalog on public.beer_entries(catalog_id);
create index beer_entries_public_recent on public.beer_entries(created_at desc,id desc) where is_public;
-- Existing diary details remain private. New UI explicitly chooses public/private.
insert into public.beer_catalog(beer,brewery,style)
 select distinct on(lower(regexp_replace(trim(beer),'\s+',' ','g')),lower(regexp_replace(trim(brewery),'\s+',' ','g'))) trim(beer),trim(brewery),style
 from public.beer_entries order by lower(regexp_replace(trim(beer),'\s+',' ','g')),lower(regexp_replace(trim(brewery),'\s+',' ','g')),created_at asc
 on conflict(beer_key,brewery_key) do nothing;
update public.beer_entries e set catalog_id=c.id from public.beer_catalog c
 where c.beer_key=lower(regexp_replace(trim(e.beer),'\s+',' ','g')) and c.brewery_key=lower(regexp_replace(trim(e.brewery),'\s+',' ','g'));
create function private.link_beer_catalog() returns trigger
 language plpgsql security definer set search_path='' as $$
begin
 new.beer := trim(new.beer); new.brewery := trim(new.brewery);
 insert into public.beer_catalog(beer,brewery,style) values(new.beer,new.brewery,new.style)
 on conflict(beer_key,brewery_key) do nothing;
 select id into new.catalog_id from public.beer_catalog
 where beer_key=lower(regexp_replace(trim(new.beer),'\s+',' ','g')) and brewery_key=lower(regexp_replace(trim(new.brewery),'\s+',' ','g'));
 return new;
end $$;
revoke all on function private.link_beer_catalog() from public,anon,authenticated;
create trigger link_entry_catalog before insert or update of beer,brewery,style,catalog_id on public.beer_entries
 for each row execute function private.link_beer_catalog();
create policy entries_public_read on public.beer_entries for select to anon,authenticated using(is_public);
grant select on public.beer_entries to anon;
-- Owners can change the visibility of their own entries, never ownership.
grant update(is_public) on public.beer_entries to authenticated;
create policy entries_visibility_own on public.beer_entries for update to authenticated
 using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
grant select on public.beer_profiles to anon;
create policy profiles_public_authors on public.beer_profiles for select to anon,authenticated
 using(exists(select 1 from public.beer_entries e where e.user_id=beer_profiles.user_id and e.is_public));
create table public.beer_cheers (
 entry_id uuid not null references public.beer_entries(id) on delete cascade,
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(entry_id,user_id)
);
create index beer_cheers_owner on public.beer_cheers(user_id);
alter table public.beer_cheers enable row level security;
revoke all on public.beer_cheers from anon,authenticated;
grant select on public.beer_cheers to anon,authenticated;
grant insert,delete on public.beer_cheers to authenticated;
create policy cheers_public_read on public.beer_cheers for select to anon,authenticated
 using(exists(select 1 from public.beer_entries e where e.id=entry_id and e.is_public));
create policy cheers_own_insert on public.beer_cheers for insert to authenticated
 with check((select auth.uid())=user_id and exists(select 1 from public.beer_entries e where e.id=entry_id and e.is_public));
create policy cheers_own_delete on public.beer_cheers for delete to authenticated using((select auth.uid())=user_id);
create table public.beer_wishlist (
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 catalog_id uuid not null references public.beer_catalog(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(user_id,catalog_id)
);
create index beer_wishlist_catalog on public.beer_wishlist(catalog_id);
alter table public.beer_wishlist enable row level security;
revoke all on public.beer_wishlist from anon,authenticated;
grant select,insert,delete on public.beer_wishlist to authenticated;
create policy wishlist_own_read on public.beer_wishlist for select to authenticated using((select auth.uid())=user_id);
create policy wishlist_own_insert on public.beer_wishlist for insert to authenticated with check((select auth.uid())=user_id);
create policy wishlist_own_delete on public.beer_wishlist for delete to authenticated using((select auth.uid())=user_id);
create table public.beer_places (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 name text not null check(char_length(trim(name)) between 1 and 120),
 city text not null default '' check(char_length(city)<=80),
 is_public boolean not null default true,
 created_at timestamptz not null default now()
);
create unique index beer_places_owner_unique on public.beer_places(user_id,lower(trim(name)),lower(trim(city)));
alter table public.beer_places enable row level security;
revoke all on public.beer_places from anon,authenticated;
grant select on public.beer_places to anon,authenticated;
grant insert,delete on public.beer_places to authenticated;
create policy places_read on public.beer_places for select to anon,authenticated using(is_public or (select auth.uid())=user_id);
create policy places_own_insert on public.beer_places for insert to authenticated with check((select auth.uid())=user_id);
create policy places_own_delete on public.beer_places for delete to authenticated using((select auth.uid())=user_id);
-- Ordinary invoker views respect the RLS of their underlying tables.
create view public.beer_library with(security_invoker=true) as
 select c.id,c.beer,c.brewery,c.style,c.source,c.created_at,
 coalesce(r.tasters_count,0) as tasters_count,coalesce(r.ratings_count,0) as ratings_count,r.rating_average
 from public.beer_catalog c left join lateral (
  select count(*) as tasters_count,count(user_rating) as ratings_count,round(avg(user_rating),2) as rating_average
  from(select e.user_id,avg(nullif(e.rating,0)) as user_rating from public.beer_entries e
   where e.catalog_id=c.id and e.is_public group by e.user_id) per_user
 ) r on true;
create view public.beer_feed with(security_invoker=true) as
 select e.id,e.user_id,e.catalog_id,e.beer,e.brewery,e.style,e.volume,e.count,e.date,e.rating,e.note,e.place_name,e.place_city,e.created_at,
 coalesce(p.nickname,'Pivní objevitel') as nickname,
 (select count(*) from public.beer_cheers c where c.entry_id=e.id) as cheers_count,
 exists(select 1 from public.beer_cheers c where c.entry_id=e.id and c.user_id=(select auth.uid())) as cheered
 from public.beer_entries e left join public.beer_profiles p on p.user_id=e.user_id where e.is_public;
create view public.beer_venues with(security_invoker=true) as
 with visits as(select lower(trim(place_name)) as name_key,lower(trim(place_city)) as city_key,min(place_name) as name,min(place_city) as city,
 count(*) as visits,count(distinct catalog_id) as beers,count(distinct user_id) as visitors,max(date) as last_visit
 from public.beer_entries where is_public and trim(place_name)<>'' group by 1,2),
 saved as(select lower(trim(name)) as name_key,lower(trim(city)) as city_key,min(name) as name,min(city) as city,count(*) as fans
 from public.beer_places where is_public group by 1,2)
 select coalesce(v.name_key,s.name_key) as name_key,coalesce(v.city_key,s.city_key) as city_key,coalesce(v.name,s.name) as name,coalesce(v.city,s.city) as city,
 coalesce(v.visits,0) as visits,coalesce(v.beers,0) as beers,coalesce(v.visitors,0) as visitors,coalesce(s.fans,0) as fans,v.last_visit
 from visits v full join saved s using(name_key,city_key);
revoke all on public.beer_library,public.beer_feed,public.beer_venues from anon,authenticated;
grant select on public.beer_library,public.beer_feed,public.beer_venues to anon,authenticated;

-- Starter catalogue; real community ratings start at zero.
insert into public.beer_catalog(beer,brewery,style,source) values
('Pilsner Urquell','Plzeňský Prazdroj','Ležák','https://www.prazdroj.cz/nase-znacky'),
('Proud','Plzeňský Prazdroj','Ležák','https://www.prazdroj.cz/nase-znacky'),
('Excelent 11','Plzeňský Prazdroj','Ležák','https://www.prazdroj.cz/nase-znacky'),
('Klasik','Plzeňský Prazdroj','Jiné','https://www.prazdroj.cz/nase-znacky'),
('Primus','Plzeňský Prazdroj','Jiné','https://www.prazdroj.cz/nase-znacky'),
('Budweiser Budvar Original','Budějovický Budvar','Ležák','https://www.budejovickybudvar.cz/piva'),
('Budvar 33','Budějovický Budvar','Ležák','https://www.budejovickybudvar.cz/piva'),
('Budvar 33 Nefiltr','Budějovický Budvar','Ležák','https://www.budejovickybudvar.cz/piva'),
('Budvar Tmavý ležák','Budějovický Budvar','Ležák','https://www.budejovickybudvar.cz/piva'),
('Budvar Reserve','Budějovický Budvar','Ležák','https://www.budejovickybudvar.cz/piva'),
('Original z čerstvého chmele','Budějovický Budvar','Ležák','https://www.budejovickybudvar.cz/piva'),
('Budvar Výčepní','Budějovický Budvar','Jiné','https://www.budejovickybudvar.cz/piva'),
('Budvar Redix','Budějovický Budvar','Jiné','https://www.budejovickybudvar.cz/piva'),
('Budvar Nealko','Budějovický Budvar','Nealkoholické','https://www.budejovickybudvar.cz/piva'),
('Old Gold IPA','Budějovický Budvar','IPA','https://www.budejovickybudvar.cz/piva'),
('NEIPANDA','Budějovický Budvar','IPA','https://www.budejovickybudvar.cz/piva'),
('Farmhouse Ale','Budějovický Budvar','Jiné','https://www.budejovickybudvar.cz/piva'),
('Charitativní ležák','Budějovický Budvar','Ležák','https://www.budejovickybudvar.cz/piva'),
('Staropramen Jedenáctka','Staropramen','Ležák','https://www.staropramen.cz/'),
('Staropramen Dvanáctka','Staropramen','Ležák','https://www.staropramen.cz/'),
('Staropramen Granát','Staropramen','Ležák','https://www.staropramen.cz/'),
('Staropramen Extra chmel','Staropramen','Ležák','https://www.staropramen.cz/'),
('Staropramen Nefiltr','Staropramen','Ležák','https://www.staropramen.cz/'),
('Staropramen Desítka','Staropramen','Jiné','https://www.staropramen.cz/'),
('Staropramen Nealko','Staropramen','Nealkoholické','https://www.staropramen.cz/'),
('Zubr Gradus 12','Zubr','Ležák','https://www.zubr.cz/'),
('Zubr Grand 11','Zubr','Ležák','https://www.zubr.cz/'),
('Zubr Grál 10','Zubr','Jiné','https://www.zubr.cz/'),
('Zubr Gold','Zubr','Jiné','https://www.zubr.cz/'),
('Zubr Yuzu','Zubr','Nealkoholické','https://www.zubr.cz/'),
('Holba Keprník 12','Holba','Ležák','https://www.holba.cz/'),
('Holba Šerák 11','Holba','Ležák','https://www.holba.cz/'),
('Holba Horská 10','Holba','Jiné','https://www.holba.cz/'),
('Holba Ryzí nealko','Holba','Nealkoholické','https://www.holba.cz/'),
('Holba Lesní malina','Holba','Jiné','https://www.holba.cz/'),
('Litovel Bohatá 12','Litovel','Ležák','https://www.litovel.cz/'),
('Litovel Vyzrálá 11','Litovel','Ležák','https://www.litovel.cz/'),
('Litovel Moravan','Litovel','Ležák','https://www.litovel.cz/'),
('Litovel Premium Dark','Litovel','Ležák','https://www.litovel.cz/'),
('Litovel Jarní zelený ležák','Litovel','Ležák','https://www.litovel.cz/'),
('Litovel Višňový ležák','Litovel','Ležák','https://www.litovel.cz/'),
('Litovel Štědrá 12','Litovel','Ležák','https://www.litovel.cz/'),
('Litovel Úrodná 10','Litovel','Jiné','https://www.litovel.cz/'),
('Litovel Svěží pomelo','Litovel','Jiné','https://www.litovel.cz/'),
('Litovel Černý citron','Litovel','Jiné','https://www.litovel.cz/'),
('Litovel Gustav 13','Litovel','Jiné','https://www.litovel.cz/'),
('Litovel Černý citron nealko','Litovel','Nealkoholické','https://www.litovel.cz/'),
('Litovel Letní pšeničné pivo','Litovel','Pšeničné','https://www.litovel.cz/'),
('Ferdinand Premium 12','Ferdinand','Ležák','https://www.pivovarferdinand.cz/'),
('Ferdinand Bezlepkový Premium 12','Ferdinand','Ležák','https://www.pivovarferdinand.cz/'),
('Ferdinand Dvorní ležák 12','Ferdinand','Ležák','https://www.pivovarferdinand.cz/'),
('Ferdinand Diplomat 11','Ferdinand','Ležák','https://www.pivovarferdinand.cz/'),
('Ferdinand Řezaný ležák 11','Ferdinand','Ležák','https://www.pivovarferdinand.cz/'),
('Ferdinand Max 11','Ferdinand','Jiné','https://www.pivovarferdinand.cz/'),
('Ferdinand Sedm kulí 13','Ferdinand','Jiné','https://www.pivovarferdinand.cz/'),
('Ferdinand Sofie 10','Ferdinand','Jiné','https://www.pivovarferdinand.cz/'),
('Ferdinand d’Este 15','Ferdinand','Jiné','https://www.pivovarferdinand.cz/'),
('Ferdinand Nealkoholické světlé','Ferdinand','Nealkoholické','https://www.pivovarferdinand.cz/'),
('Rychtář Svatováclavský ležák','Rychtář','Ležák','https://www.pivovar-rychtar.cz/'),
('Rychtář Harmonie','Rychtář','Jiné','https://www.pivovar-rychtar.cz/'),
('Bernard Nefiltrovaná 12','Bernard','Ležák','https://www.bernard.cz/'),
('Bernard Černá 12','Bernard','Ležák','https://www.bernard.cz/'),
('Bernard India Pale Ale','Bernard','IPA','https://www.bernard.cz/'),
('Bernard s čistou hlavou Švestka','Bernard','Nealkoholické','https://www.bernard.cz/'),
('Svijanský Máz 11','Svijany','Ležák','https://www.pivovarsvijany.cz/'),
('ŠLIK Zámek 11','Svijany','Ležák','https://www.pivovarsvijany.cz/'),
('Svijany 450','Svijany','Ležák','https://www.pivovarsvijany.cz/'),
('Svijanský fanda 11','Svijany','Ležák','https://www.pivovarsvijany.cz/'),
('Svijanský Rytíř 12','Svijany','Ležák','https://www.pivovarsvijany.cz/'),
('Kvasničák 13','Svijany','Ležák','https://www.pivovarsvijany.cz/'),
('Svijanský Kníže 13','Svijany','Ležák','https://www.pivovarsvijany.cz/'),
('Svijanská Kněžna 13','Svijany','Ležák','https://www.pivovarsvijany.cz/'),
('Svijanská Desítka 10','Svijany','Jiné','https://www.pivovarsvijany.cz/'),
('Baron 15','Svijany','Jiné','https://www.pivovarsvijany.cz/'),
('Bidlovka','Svijany','Jiné','https://www.pivovarsvijany.cz/'),
('Svátek za studena chmelený','Svijany','Jiné','https://www.pivovarsvijany.cz/'),
('SHINE','Svijany','Jiné','https://www.pivovarsvijany.cz/'),
('DUX','Svijany','Jiné','https://www.pivovarsvijany.cz/'),
('Svijany 20','Svijany','Jiné','https://www.pivovarsvijany.cz/'),
('Pivo přímo ze sklepa','Svijany','Jiné','https://www.pivovarsvijany.cz/'),
('CECILIA','Svijany','Jiné','https://www.pivovarsvijany.cz/'),
('Weizen','Svijany','Pšeničné','https://www.pivovarsvijany.cz/'),
('Svijanský Vozka','Svijany','Nealkoholické','https://www.pivovarsvijany.cz/'),
('Vozka yuzu a bergamot','Svijany','Nealkoholické','https://www.pivovarsvijany.cz/'),
('Vozka černý rybíz a limetka','Svijany','Nealkoholické','https://www.pivovarsvijany.cz/'),
('Svijanský Vozka angrešt a rybíz','Svijany','Nealkoholické','https://www.pivovarsvijany.cz/'),
('Primátor 11 Ležák','Primátor','Ležák','https://primator.cz/produkty/'),
('Primátor 11 Ležák nefiltrovaný','Primátor','Ležák','https://primator.cz/produkty/'),
('Primátor 12 Fest hořká','Primátor','Ležák','https://primator.cz/produkty/'),
('Primátor Premium','Primátor','Ležák','https://primator.cz/produkty/'),
('Primátor Dark','Primátor','Ležák','https://primator.cz/produkty/'),
('Primátor Tchyně','Primátor','Ležák','https://primator.cz/produkty/'),
('Primátor 13 Polotmavé','Primátor','Ležák','https://primator.cz/produkty/'),
('Primátor 16 Exkluziv','Primátor','Ležák','https://primator.cz/produkty/'),
('Primátor Jubilejní ležák','Primátor','Ležák','https://primator.cz/produkty/'),
('Primátor Single Hop Lager','Primátor','Ležák','https://primator.cz/produkty/'),
('Primátor Single Hop Lager 2023','Primátor','Ležák','https://primator.cz/produkty/'),
('Primátor Antonín','Primátor','Jiné','https://primator.cz/produkty/'),
('Primátor 21 Imperial','Primátor','Jiné','https://primator.cz/produkty/'),
('Primátor 24 Double','Primátor','Jiné','https://primator.cz/produkty/'),
('Primátor 2026 Jarní','Primátor','Jiné','https://primator.cz/produkty/'),
('Primátor 2025 Medové pivo','Primátor','Jiné','https://primator.cz/produkty/'),
('Primátor 2023 Medové pivo','Primátor','Jiné','https://primator.cz/produkty/'),
('Primátor 2023 Jarní','Primátor','Jiné','https://primator.cz/produkty/'),
('Primátor 2022 Medové pivo','Primátor','Jiné','https://primator.cz/produkty/'),
('Primátor 2021 Medové pivo','Primátor','Jiné','https://primator.cz/produkty/'),
('Primátor 2020 Špringl','Primátor','Jiné','https://primator.cz/produkty/'),
('Primátor 2019 Špringl','Primátor','Jiné','https://primator.cz/produkty/'),
('Primátor 2018 Špringl','Primátor','Jiné','https://primator.cz/produkty/'),
('Primátor 2017 Medové pivo','Primátor','Jiné','https://primator.cz/produkty/'),
('Primátor 2017 Evergreen','Primátor','Jiné','https://primator.cz/produkty/'),
('Primátor 2017 Špringl','Primátor','Jiné','https://primator.cz/produkty/'),
('Primátor APA','Primátor','Pale Ale','https://primator.cz/produkty/'),
('Primátor EPA','Primátor','Pale Ale','https://primator.cz/produkty/'),
('Primátor 2017 APAč','Primátor','Pale Ale','https://primator.cz/produkty/'),
('Primátor IPA','Primátor','IPA','https://primator.cz/produkty/'),
('Primátor Weizen','Primátor','Pšeničné','https://primator.cz/produkty/'),
('Primátor Stout','Primátor','Stout / Porter','https://primator.cz/produkty/'),
('Primátor Nealko','Primátor','Nealkoholické','https://primator.cz/produkty/'),
('Primátor Free Tchyně','Primátor','Nealkoholické','https://primator.cz/produkty/'),
('Primátor Free Tchyně Pomelo','Primátor','Nealkoholické','https://primator.cz/produkty/'),
('Primátor Nealko Tropické ovoce yuzu','Primátor','Nealkoholické','https://primator.cz/produkty/'),
('Primátor Nealko Černý rybíz a limetka','Primátor','Nealkoholické','https://primator.cz/produkty/'),
('Krušovice Bohém','Krušovice','Ležák','https://www.krusovice.cz/cs/nase-piva'),
('Krušovice 11','Krušovice','Ležák','https://www.krusovice.cz/cs/nase-piva'),
('Krušovice Ležák 12','Krušovice','Ležák','https://www.krusovice.cz/cs/nase-piva'),
('Krušovice Ležák','Krušovice','Ležák','https://www.krusovice.cz/cs/nase-piva'),
('Krušovice Imperial','Krušovice','Ležák','https://www.krusovice.cz/cs/nase-piva'),
('Krušovice Originál 10','Krušovice','Jiné','https://www.krusovice.cz/cs/nase-piva'),
('Krušovice Černé','Krušovice','Jiné','https://www.krusovice.cz/cs/nase-piva'),
('Krušovice Pšeničné','Krušovice','Pšeničné','https://www.krusovice.cz/cs/nase-piva'),
('Krušovice Hořké Nealko','Krušovice','Nealkoholické','https://www.krusovice.cz/cs/nase-piva'),
('Ostravar 12','Ostravar','Ležák','https://www.ostravar.cz/pivo/'),
('Ostravar Mustang 11','Ostravar','Ležák','https://www.ostravar.cz/pivo/'),
('Ostravar Mustang 12 hořký','Ostravar','Ležák','https://www.ostravar.cz/pivo/'),
('Ostravar 10','Ostravar','Jiné','https://www.ostravar.cz/pivo/'),
('Ostravar Černá Barbora','Ostravar','Jiné','https://www.ostravar.cz/pivo/'),
('Ostravar Rufus','Ostravar','Jiné','https://www.ostravar.cz/pivo/'),
('Kozel 12','Velkopopovický Kozel','Ležák','https://www.prazdroj.cz/nase-znacky/velkopopovicky-kozel'),
('Kozel 11','Velkopopovický Kozel','Ležák','https://www.prazdroj.cz/nase-znacky/velkopopovicky-kozel'),
('Kozel Řezaný 11','Velkopopovický Kozel','Ležák','https://www.prazdroj.cz/nase-znacky/velkopopovicky-kozel'),
('Kozel 10','Velkopopovický Kozel','Jiné','https://www.prazdroj.cz/nase-znacky/velkopopovicky-kozel'),
('Kozel Černý','Velkopopovický Kozel','Jiné','https://www.prazdroj.cz/nase-znacky/velkopopovicky-kozel'),
('Kozel Nealko','Velkopopovický Kozel','Nealkoholické','https://www.prazdroj.cz/nase-znacky/velkopopovicky-kozel'),
('Ferdinand Vídeňský ležák 13','Ferdinand','Ležák','https://www.pivovarferdinand.cz/sortiment-1'),
('Ferdinand Ernst 11','Ferdinand','Ležák','https://www.pivovarferdinand.cz/sortiment-1'),
('Ferdinand Zelený ležák 11','Ferdinand','Ležák','https://www.pivovarferdinand.cz/sortiment-1'),
('Ferdinand Pěkné číslo 14','Ferdinand','Jiné','https://www.pivovarferdinand.cz/sortiment-1'),
('Ferdinand Bezlepkové Sedm kulí 13','Ferdinand','Jiné','https://www.pivovarferdinand.cz/sortiment-1'),
('Ferdinand Slušné číslo','Ferdinand','Nealkoholické','https://www.pivovarferdinand.cz/sortiment-1'),
('Ferdinand Nealkoholické světlé bezlepkové','Ferdinand','Nealkoholické','https://www.pivovarferdinand.cz/sortiment-1'),
('Kocour K31','Kocour','Jiné','https://www.pivovar-kocour.cz/cz/nase-pivo/'),
('Kocour V3 Rauch','Kocour','Jiné','https://www.pivovar-kocour.cz/cz/nase-pivo/'),
('Kocour V3 Tokaj','Kocour','Jiné','https://www.pivovar-kocour.cz/cz/nase-pivo/'),
('Kocour Ken','Kocour','Jiné','https://www.pivovar-kocour.cz/cz/nase-pivo/'),
('Kocour Samuraj','Kocour','Pale Ale','https://www.pivovar-kocour.cz/cz/nase-pivo/'),
('Kocour Gypsy Porter','Kocour','Stout / Porter','https://www.pivovar-kocour.cz/cz/nase-pivo/'),
('Kocour 12 Višňový ležák','Kocour','Ležák','https://www.pivovarkocour.cz/'),
('Kocour 10 Studentská','Kocour','Jiné','https://www.pivovarkocour.cz/'),
('Kocour Tom Cat','Kocour','Nealkoholické','https://www.pivovarkocour.cz/'),
('Gambrinus 11','Gambrinus','Ležák','https://www.prazdroj.cz/znacka/gambrinus'),
('Gambrinus 12','Gambrinus','Ležák','https://www.prazdroj.cz/znacka/gambrinus'),
('Gambrinus Nefiltrovaný ležák','Gambrinus','Ležák','https://www.prazdroj.cz/znacka/gambrinus'),
('Gambrinus Patron 12','Gambrinus','Ležák','https://www.prazdroj.cz/znacka/gambrinus'),
('Gambrinus 10','Gambrinus','Jiné','https://www.prazdroj.cz/znacka/gambrinus'),
('Gambrinus Originál 10','Gambrinus','Jiné','https://www.prazdroj.cz/znacka/gambrinus'),
('Gambrinus Dry','Gambrinus','Jiné','https://www.prazdroj.cz/znacka/gambrinus'),
('Radegast Ryze hořká 12','Radegast','Ležák','https://www.prazdroj.cz/znacka/radegast'),
('Radegast Temně hořká 12','Radegast','Ležák','https://www.prazdroj.cz/znacka/radegast'),
('Radegast Rázná 10','Radegast','Jiné','https://www.prazdroj.cz/znacka/radegast'),
('Radegast Ratar','Radegast','Jiné','https://www.prazdroj.cz/znacka/radegast'),
('Radegast Extra hořká 15','Radegast','Jiné','https://www.prazdroj.cz/znacka/radegast'),
('Radegast ROG IPA','Radegast','IPA','https://www.prazdroj.cz/znacka/radegast'),
('Master Tmavý 18','Plzeňský Prazdroj','Jiné','https://www.prazdroj.cz/znacka/master'),
('Birell Světlý','Birell','Nealkoholické','https://www.prazdroj.cz/znacka/birell'),
('Birell Řezaný','Birell','Nealkoholické','https://www.prazdroj.cz/znacka/birell'),
('Birell Za studena chmelený','Birell','Nealkoholické','https://www.prazdroj.cz/znacka/birell'),
('Birell Stylu IPA','Birell','Nealkoholické','https://www.prazdroj.cz/znacka/birell'),
('Birell Pomelo & Grep','Birell','Nealkoholické','https://www.prazdroj.cz/znacka/birell'),
('Birell Polotmavý Citrón','Birell','Nealkoholické','https://www.prazdroj.cz/znacka/birell'),
('Birell Malina & Limetka','Birell','Nealkoholické','https://www.prazdroj.cz/znacka/birell'),
('Birell Višeň & Ostružina','Birell','Nealkoholické','https://www.prazdroj.cz/znacka/birell'),
('Birell Sicilský Citrón','Birell','Nealkoholické','https://www.prazdroj.cz/znacka/birell'),
('Birell Energy Pomelo & Grep','Birell','Nealkoholické','https://www.prazdroj.cz/znacka/birell'),
('Birell Energy Zelený čaj & Broskev','Birell','Nealkoholické','https://www.prazdroj.cz/znacka/birell'),
('Birell Vitality Mango & Citrón','Birell','Nealkoholické','https://www.prazdroj.cz/znacka/birell'),
('Birell Vitality Citrus & Zázvor','Birell','Nealkoholické','https://www.prazdroj.cz/znacka/birell'),
('Birell Vitality Marakuja & Maté','Birell','Nealkoholické','https://www.prazdroj.cz/znacka/birell')
on conflict(beer_key,brewery_key) do nothing;
notify pgrst, 'reload schema';
commit;
