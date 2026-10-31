begin;
-- Keep the original RPC available for already-open clients.
create function public.beer_leaderboard_stats(sort_by text default 'brands')
returns table(nickname text,brands bigint,total_beers bigint)
language sql stable security definer set search_path='' as $$
 select p.nickname,count(distinct lower(trim(e.brewery))||chr(9)||lower(trim(e.beer))) as brands,coalesce(sum(e.count),0)::bigint as total_beers
 from public.beer_profiles p left join public.beer_entries e on e.user_id=p.user_id
 where p.listed=true and (select auth.uid()) is not null
 group by p.user_id,p.nickname
 order by case when sort_by='total' then coalesce(sum(e.count),0) else count(distinct lower(trim(e.brewery))||chr(9)||lower(trim(e.beer))) end desc,p.nickname asc limit 50;
$$;
revoke all on function public.beer_leaderboard_stats(text) from public,anon;
grant execute on function public.beer_leaderboard_stats(text) to authenticated;
commit;
