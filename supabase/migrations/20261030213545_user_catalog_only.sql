begin;
-- Preserve a private recovery copy of unused, preloaded products.
create table if not exists private.removed_seed_catalog
 (like public.beer_catalog including defaults including generated);
revoke all on private.removed_seed_catalog from public, anon, authenticated;
insert into private.removed_seed_catalog (id, beer, brewery, style, source, created_at)
select c.id, c.beer, c.brewery, c.style, c.source, c.created_at
from public.beer_catalog c
where c.source is not null
  and not exists (select 1 from public.beer_entries e where e.catalog_id=c.id)
  and not exists (select 1 from public.beer_wishlist w where w.catalog_id=c.id);
delete from public.beer_catalog c
where c.source is not null
  and not exists (select 1 from public.beer_entries e where e.catalog_id=c.id)
  and not exists (select 1 from public.beer_wishlist w where w.catalog_id=c.id);
commit;
