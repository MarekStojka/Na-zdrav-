# Popijeme — sociální síť na pivo

Samostatná aplikace React/Vite + Supabase, veřejně na https://na-zdravi.vercel.app/. Zdrojový kód v tomto repozitáři automaticky nasazuje Vercel z větve `main`.

## Přihlášení

Přihlášení i vytvoření účtu probíhá přes Google pomocí Supabase OAuth. V Supabase musí být zapnutý Google provider a nastavený Client ID a Client Secret ze stejného webového OAuth klienta. Client Secret patří pouze do Supabase, nikdy do klientského kódu, proměnných VITE ani repozitáře.

- Google JavaScript origin: `https://na-zdravi.vercel.app`
- Google redirect URI: `https://akllmenvonrwkqdejifo.supabase.co/auth/v1/callback`
- Supabase Site URL: `https://na-zdravi.vercel.app`
- Povolený návrat: `https://na-zdravi.vercel.app/`
- Pro přístup veřejnosti je v Google Auth Platform potřeba odpovídající External audience a produkční stav aplikace.

Není potřeba vlastní SMTP. Účet nevyžaduje přezdívku; veřejné příspěvky bez ní používají označení Pivní objevitel. Žebříček je dobrovolný a používá přezdívky, nikoli e-maily.

## Lokální vývoj

Zkopírujte `.env.example` do `.env` a doplňte veřejnou URL a publishable klíč projektu Supabase. Nikdy nepoužívejte service-role/secret klíč v prohlížeči.

```sh
npm ci
npm run dev
npm run build
```

Lokální přihlášení vyžaduje povolit konkrétní lokální návratovou adresu v Supabase. Vite konfigurace dovoluje také interní náhled na hostu `terminal.local`.

## Komunita a data

- `beer_entries`: vlastní zápisy, případné místo/město a výslovně zvolená viditelnost. Veřejné zápisy jsou čitelné i bez přihlášení; změny a smazání povoluje RLS pouze vlastníkovi. Uživatel může měnit viditelnost vlastních zápisů. Starší zápisy zůstávají po migraci soukromé.
- `beer_catalog`: společná databáze piv, plněná zápisy uživatelů. Původní předvyplněné položky bez uživatelských vazeb odstraňuje migrace `20261030213545_user_catalog_only.sql` se soukromou zálohou. Nová piva doplňuje serverový trigger ze zápisů. Normalizované jméno a pivovar jsou unikátní; klienti nemohou přepisovat společné produkty.
- `beer_library`: security-invoker view. Souhrnné hodnocení pouze z veřejných ochutnávek: nejprve průměr známek každého uživatele, potom průměr uživatelů. Nula znamená bez hodnocení. Každý uživatel tedy váží stejně bez ohledu na počet zápisů.
- `beer_feed`: security-invoker view veřejných ochutnávek s přezdívkou, množstvím, datem, poznámkou, místem a počtem reakcí. E-maily nejsou součástí této datové vrstvy. Stránkování po 50 příspěvcích; sdílený odkaz `/?post=<uuid>` načte konkrétní veřejný zápis.
- `beer_cheers`: unikátní reakce Na zdraví! na příspěvek a uživatele. Reagovat lze pouze na veřejný příspěvek. Odebrat lze jen vlastní reakci; reakce na skrytý příspěvek nejsou veřejné.
- `beer_wishlist`: soukromý seznam Chci ochutnat; RLS pouze pro vlastníka.
- `beer_places`: uložené podniky s názvem/městem a volbou viditelnosti, úpravy pouze vlastníkem. `beer_venues` agreguje veřejné návštěvy a veřejně uložené podniky. Mapa je externí odkaz; aplikace nezjišťuje GPS a nevyžaduje placené mapové API.
- `beer_profiles`: přezdívka vlastníka, veřejně čitelná u autorů veřejných ochutnávek a veřejných pozvánek. Přihlášení uživatelé mohou vyhledávat přezdívky, kódy a vybrané štítky. Město bydliště je oddělené a soukromé. Žebříček dále vyžaduje dobrovolný souhlas `listed`.
- Pivní pas: 167 odznaků podle objevování, vzpomínek a společenských aktivit. Bez odměn za vypité množství. PNG kartička 1080×1350 obsahuje jen přezdívku a souhrn objevů, bez míst, dat a poznámek.

Migrace jsou v `supabase/migrations/`. `npm test` ověřuje základní izolaci i veřejnou komunitu, soukromé zápisy/přání, deduplikaci, váhu hodnocení, reakce a oprávnění vlastníků na dvou účtech a anonymní roli pomocí PGlite. Export vlastního deníku je JSON. Starší zápisy z prototypu Sites se nepřenášejí automaticky.

## Vzhled

Retro styl inspirovaný českými pivními etiketami a zápalkovými nálepkami. Vlastní vektorová ilustrace `public/retro-toast.svg`, texturovaný krémový papír a cihlová/petrolejová paleta. Fonty jsou obsluhované z `public/fonts/` včetně licencí SIL OFL. UI je responzivní, formuláře mají čistý kontrastní podklad.

Aplikace vyžaduje internet. Manifest umožňuje přidání na plochu; nejde o publikaci v obchodech s aplikacemi. Přidání kontaktních údajů provozovatele, informací o soukromí a způsobu žádosti o odstranění účtu zůstává k doplnění podle skutečných údajů provozovatele.


## Klub Popijeme — verze 0.4

- **Pivní pas:** 167 plechových cedulí v deseti sbírkách, filtrování, hledání, postup a podrobnosti. Zdroj definic `src/achievements.json`; stejné podmínky jsou v databázi. Získání ověřuje `sync_beer_achievements()` nad vlastními daty a ukládá trvale do `beer_achievements`. Přímý zápis do odznaků není klientům povolen. Po úspěchu následuje krátká pěnová animace, nejvýše tři oznámení v dávce; respektuje omezení pohybu. Objem ani počet vypitých piv není podmínkou odznaku.
- **Profilové štítky:** Objevitel, Cestovatel, Klasik, Štamgast, Kritik, Fotograf, Spojka a Nealko průzkumník. Veřejný štítek si člověk výslovně vybere v profilu ze získaných. Server odmítá nepodložený štítek. Přezdívka a vybraný štítek jsou veřejné u příspěvků. Žebříček má samostatnou sekci, není součástí pasu.
- **Příspěvky:** plus otevře volbu ochutnávky nebo pozvánky. Pivo je povinné; nabídka vychází výhradně ze skutečného komunitního katalogu. Chybějící produkt lze ručně přidat při zápisu. Fotka a text jsou nepovinné, počet, objem, známka, datum a místo jsou dostupné ve formuláři. Výchozí hodnoty jsou jedno pivo, 0,5 l, dnešek a bez známky. Veřejnost si uživatel zvolí při uložení.
- **Fotky:** jeden snímek na příspěvek, vstup JPG/PNG/WebP do 20 MB. Prohlížeč jej převede na JPEG s delší stranou nejvýše 1600 px a bez EXIF metadat. Soukromý bucket `beer-photos` přijímá pouze JPEG do 6 MB. Cesta obsahuje ID vlastníka i příspěvku; upload a mazání pouze vlastníkem. Čtení vlastníkem nebo publikem určeným viditelností příspěvku (veřejnost / přijatí přátelé). Podepsaná URL platí 120 sekund, takže již vydaný odkaz může po skrytí příspěvku tuto dobu doběhnout. Fotka se při smazání příspěvku odstraňuje i z úložiště; případný výpadek úložiště může zanechat soukromý osiřelý soubor pro pozdější úklid.
- **Přátelé a sledování:** vyhledání přes desetimístný kód nebo nejméně tři znaky přezdívky, sdílecí odkaz `/?friend=<kód>`. Odkaz otevře hledání, neodesílá automaticky žádost. Žádost přijímá pouze adresát; přátelství může zrušit kterákoli strana. Sledování je jednostranné a zpřístupňuje pouze veřejné příspěvky. Nástěnka má filtry Všechno a Moji parťáci; filtr přátel se provádí na serveru před stránkováním.
- **Pobyt v podniku:** dobrovolné „Jsem tady“ na dvě hodiny, viditelné pouze přijatým přátelům. Sledování ani čekající žádost přístup nezakládají. Server odmítá dobu nad čtyři hodiny a přátelům vrací pouze nevypršelý pobyt. Pobyt lze ukončit v sekci Parta. Nejde o GPS sledování; název a město zadává uživatel. Přehled party a pozvánek se obnovuje každou minutu a ručně tlačítkem Obnovit.
- **Místa:** nabídka již evidovaných podniků, hledání a filtr města. Soukromě uložené město bydliště v `beer_preferences` slouží pro filtr „V mém městě“; není veřejnou součástí profilu. „Poblíž“ je zde shoda města, nikoli vzdálenost nebo sledování GPS. Podniky s aktivním pobytem přátel jsou ve vlastním přehledu označené.
- **Pozvánky:** odlišené cedule „Dnes na pivo?“ s termínem, podnikem, městem a vzkazem; veřejné, pouze pro přátele nebo soukromé jednomu příteli. Potvrzení účasti je unikátní pro účet a sraz a lze ho odvolat. Pořadatel může sraz zrušit. Nástěnka zobrazuje budoucí srazy a ty započaté v posledních čtyřech hodinách. Klient načítá až 1000 nejnovějších událostí od minulého roku pro osobní kalendář.
- **Statistiky a přání:** počet různých piv, pivovarů, celkový počet piv, objem, různá místa a města, dny se zápisem i odznaky. Soukromý seznam Chci ochutnat má vlastní sekci a lze do něj ukládat přímo z nástěnky i knihovny.

Nové migrace `20261030220725_social_club.sql` a `20261030221719_badge_copy.sql` jsou již aplikované v existujícím Supabase projektu. Na něm je znovu nespouštějte. Místní názvy odpovídají serverové historii; původní rozdíl názvu první migrace popsaný v předání stále platí.

### Ověření nové verze

`npm test` zahrnuje tři účty a anonymní roli: žádosti a vlastnictví změn, soukromé město a pobyt včetně vypršení, pozvánky a potvrzení, oprávnění fotek, trvalé odznaky, nezfalšovatelné štítky a zachování původní izolace deníku.

Pro funkční test prohlížečem bez produkčních zápisů slouží `npm run test:fixture`. Spustí pouze na `127.0.0.1:54329` dočasnou PGlite databázi se smyšlenými účty a fotkami. Druhý místní Vite náhled spusťte na portu 5175 s `VITE_SUPABASE_URL=http://127.0.0.1:54329` a `VITE_SUPABASE_PUBLISHABLE_KEY=local-test-only`. Tuto konfiguraci nikdy nenasazujte. Testovací přihlášení používá místní OAuth simulaci, ne Google; pro druhý účet má místní authorize URL parametr `account=bravo`. Fixture server ani jeho data nejsou součástí produkčního webového sestavení.

Používejte Node.js 24. Verze přímých knihoven jsou připnuté a lockfile je součástí projektu. Místní `.env.local` a dočasná data Supabase CLI jsou ignorované.


## Podniky a konverzace — verze 0.5

- Zápisy mají tři skutečně oddělená publika: veřejnost, přijatí přátelé a jen autor. Serverová pravidla platí i pro přímé dotazy, fotky, reakce, komentáře a oznámení. Starší `is_public` je udržován kompatibilním triggerem. Soukromé příspěvky se na nástěnce nezobrazují ani autorovi; jsou v jeho zápisníku. Změna publika a odebrání přátelství okamžitě zruší oprávnění dalších dotazů; již vydané fotkové odkazy mohou doběhnout do 120 sekund.
- Komentáře mají odpovědi a mazání vlastníkem. Odpověď musí patřit stejnému příspěvku (složený cizí klíč). Zvon u profilu ukazuje reakce, komentáře, odpovědi, soukromé/přátelské pozvánky a odpovědi na události. Oznámení vytváří pouze databázové triggery. Neobsahují kopie textu a při ztrátě přístupu ke zdroji se nenačtou. Obnova každých 30 sekund, posledních 100 oznámení, označení jednotlivě nebo všech jako přečtených. Komentáře se načítají po 50.
- Při zápisu je volba Točené / Lahvové. Starší zápisy mají výslovně neuvedený způsob. Veřejná historie piv u podniku rozlišuje způsob podání a poslední datum; nikdy se nevydává za potvrzený aktuální výčep.
- Hodnocení podniků: veřejných 1–5 hvězd, jeden měnitelný hlas za účet a podnik, možnost odebrání. Identita podniku navazuje na normalizovaný název a město dosavadní evidence. Štamgast je člověk s veřejnými návštěvami alespoň v pěti různých dnech. Několik piv při jednom posezení se nezapočítá vícekrát. Soukromé a přátelské zápisy nepřispívají do veřejných souhrnů. Uložené oblíbené místo samo o sobě nevytváří štamgasta.
- Chci navštívit je soukromý seznam v sekci Místa. Z karty podniku lze rovnou naplánovat návštěvu s předvyplněným místem a městem.
- Samostatný osobní kalendář: měsíční přehled a seznam, vlastní události, přímé pozvánky, srazy pro přátele a veřejné události s odpovědí. Účast má trvalý stav přijato / odmítnuto a lze ji změnit. Odmítnuté události zůstávají v osobním kalendáři. Pořadatel může setkání zrušit. Odmítnutí se nepočítá do odznaků účasti.
- Budoucí akce, kupony a speciální nabídky: tabulky `beer_venue_offers` a `beer_venue_managers`. Provozovatel musí nejprve přidělit ověřeného správce ke konkrétnímu podniku; klient si tuto roli nemůže sám přidělit. Správce smí měnit jen vlastní nabídky svého podniku. Veřejnost vidí pouze zveřejněné právě platné nabídky. Zatím nebyl přidán žádný správce ani nabídka. Rozhraní pro podnikatele a sledování uplatnění kuponů jsou budoucí etapa; současné rozhraní zobrazuje prázdný přehled v detailu místa.

Migrace `20261030224152_venues_and_conversations.sql` je již aplikovaná na produkci. Mění pouze strukturu a odvozená pole stávajících zápisů; nevkládá zkušební příspěvky ani nabídky. `npm test` navíc ověřuje tři úrovně publika, odebrání přátelství, soukromí oznámení, odpovědi, pět různých dnů pro štamgasty, hvězdičky a přání, historii podání, trvalé odpovědi na pozvánky a nemožnost neoprávněně publikovat nabídku za podnik. Prohlížečem ověřeny dva lokální účty, komentář a oznámení, hodnocení, uložení podniku, vytvoření setkání a změna odpovědi v kalendáři. Zkušební data nikdy nešla na produkci.
