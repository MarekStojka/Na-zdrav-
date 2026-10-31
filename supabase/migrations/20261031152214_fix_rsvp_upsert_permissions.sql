begin;
-- PostgREST merge-duplicates updates every column present in the request,
-- including unchanged conflict keys. Permit those assignments, but keep keys immutable.
create function private.guard_rsvp_identity() returns trigger
language plpgsql set search_path='' as $$
begin
 if new.meetup_id is distinct from old.meetup_id or new.user_id is distinct from old.user_id then
  raise exception 'An RSVP cannot change its event or participant' using errcode='23514';
 end if;
 return new;
end $$;
revoke all on function private.guard_rsvp_identity() from public,anon,authenticated;
create trigger guard_rsvp_identity before update on public.beer_rsvps
 for each row execute function private.guard_rsvp_identity();
grant update(meetup_id,user_id) on public.beer_rsvps to authenticated;
commit;