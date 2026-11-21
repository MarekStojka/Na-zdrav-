// Self-service account deletion (migration 20261121150000_delete_own_account.sql): an account deletes only itself,
// everything it owns goes with it (including venue offers, which have no cascade), other accounts and the shared
// beer catalog stay, anonymous visitors cannot call it.
import {PGlite} from '@electric-sql/pglite';
import fs from 'node:fs';import assert from 'node:assert/strict';
const db=new PGlite(),dir=new URL('../supabase/migrations/',import.meta.url),A='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',B='bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to anon,authenticated;create schema if not exists storage;create table if not exists storage.objects(bucket_id text,name text,owner uuid);create table if not exists storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`);
for(const f of ['20261030_pivni_app.sql','20261030202322_pivogram_community.sql','20261030213545_user_catalog_only.sql',...fs.readdirSync(dir).filter(f=>/_(social_club|badge_copy|venues_and_conversations|multiple_meetup_invitees|fix_rsvp_upsert_permissions|social_wall_and_profiles|leaderboard_beer_totals|user_mentions|beer_aliases_and_merge|delete_own_account)\.sql$/.test(f)).sort()])await db.exec(fs.readFileSync(new URL(f,dir),'utf8'));
const asUser=async id=>{await db.exec('reset role;set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);};
const asAdmin=()=>db.exec('reset role');
const count=async(table,column,id)=>Number((await db.query(`select count(*) from ${table} where ${column}=$1`,[id])).rows[0].count);

await db.query('insert into auth.users values($1),($2)',[A,B]);
await db.query("insert into public.beer_profiles(user_id,nickname,friend_code) values($1,'Alfa','ALPHADEL01'),($2,'Bravo','BRAVODEL02')",[A,B]);
await db.query("insert into public.beer_friendships(requester,recipient,status) values($1,$2,'accepted')",[A,B]);
for(const u of [A,B])await db.query("insert into public.beer_entries(user_id,beer,brewery,style,volume,count,date,rating,visibility) values($1,$2,'Mazací pivovar','Ležák',0.5,1,current_date,4,'public')",[u,u===A?'Jen od Alfy':'Od Brava']);
await db.query("insert into public.beer_preferences(user_id,home_city) values($1,'Náchod')",[A]);
await db.query("insert into public.beer_venue_managers values($1,'u alfy','náchod')",[A]);
await db.query("insert into public.beer_venue_offers(name_key,city_key,manager_id,kind,title,starts_at,ends_at,published) values('u alfy','náchod',$1,'coupon','Kupón od Alfy',now(),now()+interval '1 day',true)",[A]);
const bravoEntry=(await db.query('select id from public.beer_entries where user_id=$1',[B])).rows[0].id;
await asUser(A);await db.query("insert into public.beer_comments(entry_id,body) values($1,'Komentář od Alfy')",[bravoEntry]);

// Anonymous visitors cannot delete anything.
await db.exec('reset role;set role anon');await db.query("select set_config('request.jwt.claim.sub','',false)");
await assert.rejects(()=>db.query('select public.delete_own_account()'));
// The function takes no account id, so B cannot aim it at A.
await asUser(B);await assert.rejects(()=>db.query('select public.delete_own_account($1)',[A]));
await asAdmin();assert.equal(await count('auth.users','id',A),1);

// A deletes itself.
await asUser(A);await db.query('select public.delete_own_account()');
await asAdmin();
assert.equal(await count('auth.users','id',A),0);
for(const [table,column] of [['public.beer_profiles','user_id'],['public.beer_entries','user_id'],['public.beer_preferences','user_id'],['public.beer_venue_managers','user_id'],['public.beer_venue_offers','manager_id'],['public.beer_comments','user_id'],['public.beer_friendships','requester'],['public.beer_friendships','recipient']])
 assert.equal(await count(table,column,A),0,`${table}.${column} left over`);
// B and its tasting stay, and so does the shared catalog row A created.
assert.equal(await count('auth.users','id',B),1);assert.equal(await count('public.beer_profiles','user_id',B),1);assert.equal(await count('public.beer_entries','user_id',B),1);
assert.equal(Number((await db.query("select count(*) from public.beer_catalog where beer='Jen od Alfy'")).rows[0].count),1);
console.log('PASS: account deletion removes only the caller with profile, tastings, comments, friendships, preferences, venue manager rows and offers; other accounts and the shared catalog stay; anonymous callers and targeting another account are rejected.');
await db.close();
