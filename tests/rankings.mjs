import {PGlite} from '@electric-sql/pglite';
import fs from 'node:fs';import assert from 'node:assert/strict';
const db=new PGlite();await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to anon,authenticated;`);
for(const name of ['20261030_pivni_app.sql','20261031182142_leaderboard_beer_totals.sql'])await db.exec(fs.readFileSync(new URL('../supabase/migrations/'+name,import.meta.url),'utf8'));
const a='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',b='bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';await db.query('insert into auth.users values($1),($2)',[a,b]);
await db.query("insert into public.beer_profiles(user_id,nickname,listed) values($1,'Explorer',true),($2,'Regular',true)",[a,b]);
const beer=async(id,name,count)=>db.query("insert into public.beer_entries(user_id,beer,brewery,style,volume,count,date,rating) values($1,$2,'Test brewery','Ležák',0.5,$3,current_date,0)",[id,name,count]);
for(const name of ['One','Two','Three'])await beer(a,name,1);await beer(b,'Same beer',10);await beer(b,'Same beer',2);
for(let i=0;i<51;i++){const id='00000000-0000-4000-8000-'+String(i).padStart(12,'0');await db.query('insert into auth.users values($1)',[id]);await db.query("insert into public.beer_profiles(user_id,nickname,listed) values($1,$2,true)",[id,'Other '+String(i).padStart(2,'0')]);await beer(id,'One',1);await beer(id,'Two',1);}
await db.exec('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[a]);
let rows=(await db.query("select * from public.beer_leaderboard_stats('brands')")).rows;assert.equal(rows.length,50);assert.equal(rows[0].nickname,'Explorer');assert(!rows.some(r=>r.nickname==='Regular'));
rows=(await db.query("select * from public.beer_leaderboard_stats('total')")).rows;assert.equal(rows[0].nickname,'Regular');assert.equal(Number(rows[0].total_beers),12);assert.equal(Number(rows[0].brands),1);assert.deepEqual(Object.keys(rows[0]),['nickname','brands','total_beers']);
await db.query("select set_config('request.jwt.claim.sub',$1,false)",[b]);await db.exec('update public.beer_profiles set listed=false');assert(!(await db.query("select * from public.beer_leaderboard_stats('total')")).rows.some(r=>r.nickname==='Regular'));
await db.query("select set_config('request.jwt.claim.sub','',false)");assert.equal((await db.query("select * from public.beer_leaderboard_stats('total')")).rows.length,0);await db.exec('reset role;set role anon');await assert.rejects(()=>db.query('select * from public.beer_leaderboard_stats()'));
await db.close();console.log('PASS: both ranking orders, repeated beer quantities, independent top 50, opt-in removal, no private rows/IDs and anonymous access blocked.');
