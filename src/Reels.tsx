import {useEffect, useRef, useState} from 'react';
import {Heart, MapPin, MessageCircle, Search, Share2, X} from 'lucide-react';
import {errorMessage, requireClient} from './supabase';
import {usePhoto} from './photos';
import {niceDate, sharePost, toggleCheer} from './community-data';
import {MentionText} from './Mentions';

/** Exact filter set by tapping a beer or a venue (in a reel, the library or the places screen). */
export type ReelsFilter = {catalogId?: string; beer?: string; brewery?: string; place?: string; city?: string};

const PAGE = 12;
// PostgREST `or=(…)` and `ilike` patterns: strip characters that would break the filter syntax.
const cleanQuery = (q: string) => q.replace(/[,()*%\\.:]/g, ' ').replace(/\s+/g, ' ').trim();
// Case-insensitive exact match (venues are grouped by normalised name, so spelling case may differ between visits).
const exactLike = (v: string) => v.replace(/[\\%_]/g, '\\$&');

type Props = {
  userId: string | null;
  filter: ReelsFilter;
  onFilter: (filter: ReelsFilter) => void;
  onLogin: () => void;
  onToast: (message: string) => void;
};

/**
 * "Objevuj": public photo posts as a vertical, full-height stream (like Instagram Reels).
 * Only public entries with a photo are shown (beer_feed already hides private ones; friends-only ones are filtered out here).
 */
export default function Reels({userId, filter, onFilter, onLogin, onToast}: Props) {
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const sentinel = useRef<HTMLDivElement | null>(null);

  // Search as you type, with a short pause so every keystroke does not hit the database.
  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(cleanQuery(text)), 350);
    return () => window.clearTimeout(timer);
  }, [text]);

  function request(from: number) {
    let r = requireClient().from('beer_feed').select('*').eq('visibility', 'public').not('photo_path', 'is', null);
    if (filter.catalogId) r = r.eq('catalog_id', filter.catalogId);
    else {
      if (filter.beer) r = r.eq('beer', filter.beer);
      if (filter.brewery) r = r.eq('brewery', filter.brewery);
    }
    if (filter.place) r = r.ilike('place_name', exactLike(filter.place));
    if (filter.city) r = r.ilike('place_city', exactLike(filter.city));
    if (query) r = r.or(['beer', 'brewery', 'place_name', 'place_city'].map(column => `${column}.ilike.*${query}*`).join(','));
    return r.order('created_at', {ascending: false}).order('id', {ascending: false}).range(from, from + PAGE - 1);
  }

  async function load(append: boolean) {
    const gen = append ? generation.current : ++generation.current;
    setLoading(true);
    setError('');
    try {
      const {data, error} = await request(append ? items.length : 0);
      if (error) throw error;
      if (gen !== generation.current) return;
      setItems(old => (append ? [...old, ...(data || [])] : data || []));
      setMore((data || []).length === PAGE);
    } catch (e) {
      if (gen === generation.current) setError(errorMessage(e));
    } finally {
      if (gen === generation.current) setLoading(false);
    }
  }

  useEffect(() => {
    window.scrollTo({top: 0});
    void load(false);
  }, [filter.catalogId, filter.beer, filter.brewery, filter.place, filter.city, query]);

  // Load the next page when the end of the stream comes into view.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !more) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting) && !loading) void load(true);
    }, {rootMargin: '600px 0px'});
    observer.observe(el);
    return () => observer.disconnect();
  }, [more, loading, items.length]);

  const filterLabel = filter.beer
    ? filter.beer + (filter.brewery ? ' · ' + filter.brewery : '')
    : filter.place
      ? filter.place + (filter.city ? ', ' + filter.city : '')
      : '';

  return (
    <section className="reels" aria-label="Objevuj">
      <div className="reels-bar">
        <label className="reels-search">
          <Search size={16} aria-hidden="true" />
          <input value={text} onChange={e => setText(e.target.value)} maxLength={80} placeholder="Pivo, pivovar nebo podnik…" aria-label="Hledat pivo, pivovar nebo podnik" />
          {text && <button type="button" aria-label="Vymazat hledání" onClick={() => setText('')}><X size={16} /></button>}
        </label>
        {filterLabel && (
          <button type="button" className="reels-chip" onClick={() => onFilter({})} aria-label={'Zrušit filtr ' + filterLabel}>
            {filter.place ? <MapPin size={14} /> : null}
            <span>{filterLabel}</span>
            <X size={14} />
          </button>
        )}
      </div>
      {error && <p className="notice" role="alert">{error} <button className="inline-action" onClick={() => load(false)}>Zkusit znovu</button></p>}
      <div className="reels-track">
        {items.map(entry => (
          <Reel key={entry.id} entry={entry} userId={userId} onLogin={onLogin} onToast={onToast} onFilter={onFilter} />
        ))}
        {more && <div ref={sentinel} className="reels-more">Načítám další…</div>}
        {!loading && !error && !items.length && (
          <div className="reels-empty">
            <b>{filterLabel || query ? 'Tady zatím žádná fotka není.' : 'Zatím žádné veřejné fotky.'}</b>
            <p>{filterLabel || query ? 'Zkus jiné pivo nebo podnik, nebo přidej první fotku sám.' : 'Přidej ochutnávku s fotkou a nastav ji jako veřejnou.'}</p>
          </div>
        )}
        {loading && !items.length && <div className="reels-more">Načítám fotky…</div>}
      </div>
    </section>
  );
}

function Reel({entry, userId, onLogin, onToast, onFilter}: {entry: any; userId: string | null; onLogin: () => void; onToast: (s: string) => void; onFilter: (f: ReelsFilter) => void}) {
  const {url, failed} = usePhoto(entry.photo_path);
  const [cheered, setCheered] = useState(!!entry.cheered);
  const [count, setCount] = useState(Number(entry.cheers_count || 0));
  const [busy, setBusy] = useState(false);

  async function cheer() {
    if (!userId) { onLogin(); return; }
    setBusy(true);
    try {
      await toggleCheer(entry.id, cheered);
      setCount(c => c + (cheered ? -1 : 1));
      setCheered(!cheered);
    } catch (e) {
      onToast(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    try {
      await sharePost(entry);
      if (!navigator.share) onToast('Odkaz na ochutnávku je zkopírovaný.');
    } catch (e: any) {
      if (e?.name !== 'AbortError') onToast('Sdílení se nepodařilo. Zkus to znovu.');
    }
  }

  return (
    <article className="reel">
      {url
        ? <img src={url} alt={'Ochutnávka: ' + entry.beer} loading="lazy" />
        : <div className="reel-placeholder">{failed ? 'Fotka už není dostupná.' : 'Vyvolávám fotku…'}</div>}
      <div className="reel-info">
        <p className="reel-author">{entry.nickname} · {niceDate(entry.date)}</p>
        <button type="button" className="reel-beer" onClick={() => onFilter({catalogId: entry.catalog_id || undefined, beer: entry.beer, brewery: entry.brewery})} title="Všechny fotky tohoto piva">
          <b>{entry.beer}</b> <span>{entry.brewery}</span>
        </button>
        {entry.place_name && (
          <button type="button" className="reel-place" onClick={() => onFilter({place: entry.place_name, city: entry.place_city})} title="Všechny fotky z tohoto podniku">
            <MapPin size={13} />{entry.place_name}{entry.place_city && ', ' + entry.place_city}
          </button>
        )}
        {entry.rating > 0 && <span className="reel-stars" aria-label={'Hodnocení ' + entry.rating + ' z 5'}>{'★'.repeat(entry.rating)}<i>{'★'.repeat(5 - entry.rating)}</i></span>}
        {entry.note && <p className="reel-note"><MentionText text={entry.note} /></p>}
      </div>
      <div className="reel-actions">
        <button type="button" className={cheered ? 'cheered' : ''} aria-pressed={cheered} aria-label={'Na zdraví! ' + count} disabled={busy} onClick={cheer}>
          <Heart size={26} fill={cheered ? 'currentColor' : 'none'} /><b>{count}</b>
        </button>
        <a href={'/?post=' + encodeURIComponent(entry.id)} aria-label={'Komentáře ' + Number(entry.comments_count || 0)}>
          <MessageCircle size={26} /><b>{Number(entry.comments_count || 0)}</b>
        </a>
        <button type="button" aria-label={'Sdílet ' + entry.beer} onClick={share}>
          <Share2 size={24} />
        </button>
      </div>
    </article>
  );
}
