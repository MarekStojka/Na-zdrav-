import {PGlite} from '@electric-sql/pglite';
import fs from 'node:fs';import assert from 'node:assert/strict';
const db=new PGlite(),dir=new URL('../supabase/migrations/',import.meta.url),A='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',B='bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to anon,authenticated;create schema if not exists storage;create table if not exists storage.objects(bucket_id text,name text,owner uuid);create table if not exists storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`);
for(const f of ['20261030_pivni_app.sql','20261030202322_pivogram_community.sql','20261030213545_user_catalog_only.sql',...fs.readdirSync(dir).filter(f=>/_(social_club|badge_copy|venues_and_conversations|multiple_meetup_invitees|fix_rsvp_upsert_permissions|social_wall_and_profiles|leaderboard_beer_totals|user_mentions)\.sql$/.test(f)).sort()])await db.exec(fs.readFileSync(new URL(f,dir),'utf8'));
await db.query('insert into auth.users values($1),($2)',[A,B]);
const add=(u,beer,brewery,count=1)=>db.query("insert into public.beer_entries(user_id,beer,brewery,style,volume,count,date,rating,visibility) values($1,$2,$3,'Ležák',0.5,$4,current_date,4,'public')",[u,beer,brewery,count]);
await add(A,'Pilsner Urquell','Pilsner Urquell');await add(B,'Pilsner Urquell','Plzeňský Prazdroj');await add(A,'Budvar 10','Budvar',3);
await add(A,'Radegast 12 Ryze hořká','Plzeň Prazdroj');await add(B,'Radegast 10','Radegast');await add(A,'SHERPA','PERMON Craft Brewery');
const cat=async(b,r)=>(await db.query('select id from public.beer_catalog where beer=$1 and brewery=$2',[b,r])).rows[0]?.id;
await db.query('insert into public.beer_wishlist(user_id,catalog_id) values($1,$2),($3,$2),($3,$4)',[B,await cat('Budvar 10','Budvar'),A,await cat('Pilsner Urquell','Plzeňský Prazdroj')]);
await db.query('insert into public.beer_wishlist(user_id,catalog_id) values($1,$2)',[A,await cat('Pilsner Urquell','Pilsner Urquell')]);
const sql=fs.readFileSync(new URL('20261121100000_beer_aliases_and_merge.sql',dir),'utf8');
await db.exec(sql);
for(let i=0;i<2;i++)await db.exec("select private.merge_beer('Budvar 10','Budvar','Budvar Výčepní','Budějovický Budvar');select private.merge_brewery('Plzeň Prazdroj','Plzeňský Prazdroj')");
const rows=(await db.query('select e.beer,e.brewery,e.count,c.beer cb,c.brewery cr from public.beer_entries e join public.beer_catalog c on c.id=e.catalog_id order by e.created_at')).rows;
assert.deepEqual(rows.map(r=>r.brewery+' | '+r.beer),['Plzeňský Prazdroj | Pilsner Urquell','Plzeňský Prazdroj | Pilsner Urquell','Budějovický Budvar | Budvar Výčepní','Radegast | Radegast Ryze hořká 12','Radegast | Radegast Rázná 10','PERMON Craft Brewery | SHERPA']);
assert.ok(rows.every(r=>r.cb===r.beer&&r.cr===r.brewery));assert.equal(rows[2].count,3);
for(const [b,r] of [['Budvar 10','Budvar'],['Pilsner Urquell','Pilsner Urquell'],['Radegast 12 Ryze hořká','Plzeň Prazdroj'],['Radegast 10','Radegast']])assert.equal(await cat(b,r),undefined);
const wish=(await db.query('select w.user_id,c.beer from public.beer_wishlist w join public.beer_catalog c on c.id=w.catalog_id order by 1,2')).rows.map(r=>r.user_id.slice(0,1)+':'+r.beer);
assert.deepEqual(wish,['a:Budvar Výčepní','a:Pilsner Urquell','b:Budvar Výčepní']);
assert.equal((await db.query("select count(*)::int n from public.beer_catalog where brewery in('Budvar','Pilsner Urquell','Plzeň Prazdroj')")).rows[0].n,0);
// Typing a known duplicate later lands on the official beer; a known brewery alias fixes just the brewery.
await add(B,' budvar  10 ','BUDVAR',2);await add(B,'Proud','Plzeň Prazdroj');await add(B,'Něco nového','Budvar');
const late=(await db.query('select e.beer,e.brewery,c.beer cb from public.beer_entries e join public.beer_catalog c on c.id=e.catalog_id order by e.created_at desc limit 3')).rows.map(r=>r.brewery+' | '+r.beer+' | '+r.cb);
assert.deepEqual(late,['Budějovický Budvar | Něco nového | Něco nového','Plzeňský Prazdroj | Proud | Proud','Budějovický Budvar | Budvar Výčepní | Budvar Výčepní']);
for(const role of ['anon','authenticated']){await db.exec('set role '+role);await assert.rejects(()=>db.query("select private.merge_beer('a','b','c','d')"));await assert.rejects(()=>db.query('select * from private.beer_aliases'));await db.exec('reset role')}
console.log('PASS: aliases rewrite known duplicates on save, app roles cannot merge; duplicate breweries merged into official presets (entries renamed and relinked, counts kept, wishes moved without duplicates, old catalog rows gone, idempotent).');await db.close();
