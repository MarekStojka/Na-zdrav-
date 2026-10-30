-- Apply only in a NEW dedicated Supabase project. No changes to existing projects.
begin;
create table public.beer_entries (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 beer text not null check (char_length(trim(beer)) between 1 and 80),
 brewery text not null check (char_length(trim(brewery)) between 1 and 80),
 style text not null check (style in ('Ležák','IPA','Pale Ale','Pšeničné','Stout / Porter','Nealkoholické','Jiné')),
 volume numeric(3,1) not null check (volume in (0.2,0.3,0.4,0.5,1)),
 count integer not null check (count between 1 and 100),
 date date not null check (date <= (now() at time zone 'Europe/Prague')::date),
 rating integer not null default 0 check (rating between 0 and 5),
 note text not null default '' check (char_length(note) <= 500),
 created_at timestamptz not null default now()
);
create index beer_entries_owner_date on public.beer_entries(user_id,date desc,created_at desc);
create table public.beer_profiles (
 user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
 nickname text not null check (char_length(trim(nickname)) between 1 and 30),
 listed boolean not null default false
);
create unique index beer_profiles_unique_nickname on public.beer_profiles(lower(trim(nickname)));
alter table public.beer_entries enable row level security;
alter table public.beer_profiles enable row level security;
revoke all on public.beer_entries,public.beer_profiles from anon,authenticated;
grant select,insert,delete on public.beer_entries to authenticated;
grant select,insert,update on public.beer_profiles to authenticated;
create policy entries_read_own on public.beer_entries for select to authenticated using ((select auth.uid())=user_id);
create policy entries_insert_own on public.beer_entries for insert to authenticated with check ((select auth.uid())=user_id);
create policy entries_delete_own on public.beer_entries for delete to authenticated using ((select auth.uid())=user_id);
create policy profiles_read_own on public.beer_profiles for select to authenticated using ((select auth.uid())=user_id);
create policy profiles_insert_own on public.beer_profiles for insert to authenticated with check ((select auth.uid())=user_id);
create policy profiles_update_own on public.beer_profiles for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
-- This function returns only opt-in nicknames + distinct product count. No IDs, emails, notes or quantities.
create function public.beer_leaderboard() returns table(nickname text,brands bigint)
language sql stable security definer set search_path = '' as $$
 select p.nickname, count(distinct lower(trim(e.brewery))||chr(9)||lower(trim(e.beer))) as brands
 from public.beer_profiles p left join public.beer_entries e on e.user_id=p.user_id
 where p.listed=true and (select auth.uid()) is not null
 group by p.user_id,p.nickname order by brands desc,p.nickname asc limit 50;
$$;
revoke all on function public.beer_leaderboard() from public,anon;
grant execute on function public.beer_leaderboard() to authenticated;
commit;
