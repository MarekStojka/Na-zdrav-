-- Self-service account deletion (Freelo 34080741).
-- A signed-in account can delete itself from the profile ("Smazat účet"). Deleting the auth.users row cascades to
-- everything the account owns: profile, tastings, comments, cheers, friendships, follows, meetups and RSVPs,
-- notifications, presence, ratings, wishlists, achievements, preferences and venue manager rows. Venue offers are the
-- one table whose manager_id has no cascade, so they are removed first. Beers the account added to beer_catalog stay
-- (the catalog has no link to users), as the terms and privacy policy say.
-- Photos in the private bucket beer-photos are not touched here: Supabase refuses direct deletes from storage tables,
-- so the app removes the account's folder through the Storage API before calling this function.
-- The function only ever deletes auth.uid(): there is no parameter, so nobody can delete another account.
create function private.delete_own_account() returns void language plpgsql security definer set search_path='' as $$
declare
 me uuid:=auth.uid();
begin
 if me is null then
  raise exception 'Not signed in' using errcode='42501';
 end if;
 delete from public.beer_venue_offers where manager_id=me;
 delete from auth.users where id=me;
end;
$$;
revoke all on function private.delete_own_account() from public,anon;
grant execute on function private.delete_own_account() to authenticated;

create function public.delete_own_account() returns void language sql security invoker set search_path='' as $$select private.delete_own_account()$$;
revoke all on function public.delete_own_account() from public,anon;
grant execute on function public.delete_own_account() to authenticated;
