import {useEffect, useMemo, useState} from 'react';
import {Bookmark, Check, ChevronLeft, ChevronRight, Clapperboard, Plus, Search, X} from 'lucide-react';
import {normalize, productKey, toggleWishlist} from './community-data';
import {errorMessage} from './supabase';
import beerPresets from './beer-catalog.json';

const STYLES = ['Ležák', 'IPA', 'Pale Ale', 'Pšeničné', 'Stout / Porter', 'Nealkoholické', 'Jiné'];

type Props = {
  state: any;
  entries: any[];
  userId: string | null;
  onLogin: () => void;
  onTaste: (p: any) => void;
  onToast: (message: string) => void;
  onReels?: (filter: {catalogId?: string; beer?: string; brewery?: string}) => void;
  /** "Chci ochutnat": just the user's wishlist as a flat list, no browsing or filters. */
  wishlistOnly?: boolean;
};

/**
 * "Knihovna piv" as a simple drill-down: breweries → their beers, with one search box and a style filter on top.
 * Shows community beers (with ratings) merged with the preset catalogue, so every brewery is complete even before
 * anyone has logged its beers.
 */
export default function BeerLibrary({state, entries, userId, onLogin, onTaste, onToast, onReels, wishlistOnly = false}: Props) {
  const [query, setQuery] = useState('');
  const [style, setStyle] = useState('');
  const [breweryKey, setBreweryKey] = useState<string | null>(null);
  const [pending, setPending] = useState('');

  useEffect(() => { window.scrollTo({top: 0}); }, [breweryKey]);

  const tasted = useMemo(() => new Set(entries.map(productKey)), [entries]);

  // Community beers first (they have ids, ratings and photos), then presets nobody has logged yet.
  const beers = useMemo(() => {
    const known = new Set(state.library.map(productKey));
    const presets = (beerPresets as any[])
      .filter(p => !known.has(productKey(p)))
      .map(p => ({beer: p.beer, brewery: p.brewery, style: p.style, preset: true, ratings_count: 0, tasters_count: 0}));
    return [...state.library, ...presets];
  }, [state.library]);

  // Display name of a brewery: the preset spelling when there is one, so community variants group under it.
  const breweryNames = useMemo(() => {
    const names = new Map<string, string>();
    for (const p of beerPresets as any[]) if (!names.has(normalize(p.brewery))) names.set(normalize(p.brewery), p.brewery);
    for (const p of state.library) if (!names.has(normalize(p.brewery))) names.set(normalize(p.brewery), p.brewery);
    return names;
  }, [state.library]);

  const styled = beers.filter(p => !style || p.style === style);

  const breweries = useMemo(() => {
    const groups = new Map<string, {key: string; name: string; beers: any[]; tastings: number}>();
    for (const p of styled) {
      const key = normalize(p.brewery);
      const group = groups.get(key) || {key, name: breweryNames.get(key) || p.brewery, beers: [], tastings: 0};
      group.beers.push(p);
      group.tastings += Number(p.tasters_count || 0);
      groups.set(key, group);
    }
    return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name, 'cs'));
  }, [styled, breweryNames]);

  const words = normalize(query).split(' ').filter(Boolean);
  const matches = (text: string) => words.every(w => normalize(text).includes(w));
  const byPopularity = (a: any, b: any) =>
    Number(b.tasters_count || 0) - Number(a.tasters_count || 0) || a.beer.localeCompare(b.beer, 'cs');

  const current = breweryKey ? breweries.find(b => b.key === breweryKey) : null;
  const searching = words.length > 0;
  const foundBreweries = searching ? breweries.filter(b => matches(b.name)).slice(0, 8) : [];
  const foundBeers = searching ? styled.filter(p => matches(p.beer + ' ' + p.brewery)).sort(byPopularity).slice(0, 60) : [];

  async function wish(p: any) {
    if (!userId) { onLogin(); return; }
    setPending(p.id);
    try {
      await toggleWishlist(p.id, state.wishlist.includes(p.id));
      await state.reload();
    } catch (e) {
      onToast(errorMessage(e));
    } finally {
      setPending('');
    }
  }

  function BeerRow({p, showBrewery}: {p: any; showBrewery?: boolean}) {
    const saved = state.wishlist.includes(p.id);
    const rated = p.ratings_count > 0;
    return (
      <li className="lib-beer">
        <div className="lib-beer-text">
          <b>{p.beer}</b>
          <small>
            {showBrewery && <span>{breweryNames.get(normalize(p.brewery)) || p.brewery}</span>}
            <span>{p.style}</span>
            {rated && <span className="lib-score">★ {Number(p.rating_average).toLocaleString('cs-CZ', {maximumFractionDigits: 1})} ({p.ratings_count})</span>}
            {tasted.has(productKey(p)) && <span className="lib-tasted"><Check size={12} />mám</span>}
          </small>
        </div>
        <div className="lib-actions">
          {p.tasters_count > 0 && onReels && (
            <button type="button" aria-label={'Fotky: ' + p.beer} title="Fotky v Objevuj" onClick={() => onReels({catalogId: p.id, beer: p.beer, brewery: p.brewery})}>
              <Clapperboard size={18} />
            </button>
          )}
          {p.id && !p.preset && (
            <button type="button" className={saved ? 'saved' : ''} aria-pressed={saved} disabled={pending === p.id}
              aria-label={(saved ? 'Odebrat z přání: ' : 'Chci ochutnat: ') + p.beer} title="Chci ochutnat" onClick={() => wish(p)}>
              <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
            </button>
          )}
          <button type="button" className="lib-add" aria-label={'Zapsat ' + p.beer} title="Zapsat ochutnávku" onClick={() => onTaste(p)}>
            <Plus size={18} />
          </button>
        </div>
      </li>
    );
  }

  function BreweryRow({b}: {b: {key: string; name: string; beers: any[]; tastings: number}}) {
    return (
      <li>
        <button type="button" className="lib-brewery" onClick={() => { setQuery(''); setBreweryKey(b.key); }}>
          <span className="lib-initial" aria-hidden="true">{b.name[0]}</span>
          <span className="lib-brewery-text">
            <b>{b.name}</b>
            <small>{b.beers.length} {b.beers.length === 1 ? 'pivo' : b.beers.length < 5 ? 'piva' : 'piv'}{b.tastings > 0 ? ' · ' + b.tastings + ' ochutnalo' : ''}</small>
          </span>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </li>
    );
  }

  if (wishlistOnly) {
    const wished = state.library
      .filter((p: any) => state.wishlist.includes(p.id))
      .sort((a: any, b: any) => a.brewery.localeCompare(b.brewery, 'cs') || a.beer.localeCompare(b.beer, 'cs'));
    return (
      <section className="beer-library">
        <div className="section-heading"><div><h2>Chci ochutnat{wished.length ? ' (' + wished.length + ')' : ''}</h2></div></div>
        <p className="section-intro">Piva na příště. Přidáš je záložkou u piva v knihovně nebo u příspěvku.</p>
        {!userId
          ? <p className="notice"><button className="inline-action" onClick={onLogin}>Přihlas se</button> a ukládej si piva na příště.</p>
          : wished.length
            ? <ul className="lib-list">{wished.map((p: any) => <BeerRow key={p.id} p={p} showBrewery />)}</ul>
            : <p className="lib-empty">Zatím tu nic není. V knihovně nebo u příspěvku klepni na záložku a pivo se objeví tady.</p>}
      </section>
    );
  }

  return (
    <section className="beer-library">
      <div className="section-heading">
        <div><h2>{current && !searching ? current.name : 'Knihovna piv'}</h2></div>
      </div>
      {current && !searching
        ? <button type="button" className="lib-back" onClick={() => setBreweryKey(null)}><ChevronLeft size={18} />Všechny pivovary</button>
        : <p className="section-intro">{breweries.length} pivovarů · {styled.length} piv. Hodnocení je z veřejných ochutnávek.</p>}

      <div className="lib-filter">
        <label className="lib-search">
          <Search size={16} aria-hidden="true" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Hledat pivo nebo pivovar…" aria-label="Hledat pivo nebo pivovar" maxLength={80} />
          {query && <button type="button" aria-label="Vymazat hledání" onClick={() => setQuery('')}><X size={16} /></button>}
        </label>
        <select value={style} onChange={e => setStyle(e.target.value)} aria-label="Pivní styl">
          <option value="">Styl</option>
          {STYLES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {searching ? (
        <>
          {foundBreweries.length > 0 && (
            <>
              <h3 className="lib-subtitle">Pivovary</h3>
              <ul className="lib-list">{foundBreweries.map(b => <BreweryRow key={b.key} b={b} />)}</ul>
            </>
          )}
          <h3 className="lib-subtitle">Piva</h3>
          {foundBeers.length
            ? <ul className="lib-list">{foundBeers.map(p => <BeerRow key={productKey(p)} p={p} showBrewery />)}</ul>
            : <p className="lib-empty">Takové pivo neznáme. Můžeš ho zapsat ručně přes „Zapsat pivo“.</p>}
        </>
      ) : current ? (
        <ul className="lib-list">{[...current.beers].sort(byPopularity).map(p => <BeerRow key={productKey(p)} p={p} />)}</ul>
      ) : (
        <ul className="lib-list">{breweries.map(b => <BreweryRow key={b.key} b={b} />)}</ul>
      )}
    </section>
  );
}
