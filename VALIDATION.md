Ověřeno 30. 10. 2026

- Produkční build TypeScript + Vite: úspěšný.
- PostgreSQL migrace a RLS: testováno v PGlite se dvěma účty a anonymním návštěvníkem. Vlastní zápisy fungují, cizí čtení a mazání jsou blokované, podvržené vlastnictví je odmítnuté. Žebříček respektuje dobrovolnou účast a nevrací soukromé záznamy.
- Zdroj aplikace neobsahuje vazbu na přihlášení ChatGPT ani API Sites.

Zatím neověřeno: živý projekt Supabase, doručování ověřovacích e-mailů a obnovy hesla, registrace dvou reálných uživatelů, finální nasazení na vlastní hosting. Přístupové údaje ani hostovaná databáze nejsou vytvořené.

30. 10. 2026: migrace create_beer_diary úspěšně aplikovaná v potvrzeném projektu akllmenvonrwkqdejifo. RLS zapnuté na obou tabulkách. Kontrola hlásí záměrné SECURITY DEFINER RPC beer_leaderboard: vstup bez parametrů, fixní search_path, pouze opt-in agregace, dostupné výhradně authenticated. Neužitý index je očekávaný u nových prázdných tabulek. Živé e-mailové přihlašování ještě neověřeno.

## Retro redesign — 2026-10-30

- Replaced hero artwork with an original local SVG; themed navigation, stats, diary cards, dialogs, picker and charts.
- Self-hosted 10 subsetted font faces with SIL OFL licenses; no runtime font CDN dependency.
- Desktop browser QA and a 375 CSS pixel iframe layout check passed without horizontal overflow.
- Google sign-in dialog and navigation to statistics checked. Auth/data logic is unchanged by the redesign; no new records or accounts were created for design QA.
- TypeScript check and Vite production build passed.


## Pivogram community — 2026-10-30

- Community migration applied to project akllmenvonrwkqdejifo. 188 seeded products, zero invented reviews or visits.
- PGlite checks passed: normalized product uniqueness, equal per-user rating weight, public-only feed and venue aggregation, anonymous reads limited by RLS, private diary/wishlist isolation, owner-only writes/deletes, forged-owner rejection, reaction uniqueness and cleanup.
- Post-migration security advisors reported no new findings. The existing intentional opt-in leaderboard definer and password-protection warnings remain unchanged. Google sign-in does not use passwords.
- Browser QA: public library loads real Supabase data, search Pilsner returns Pilsner Urquell; places empty state; 375 CSS pixel mobile layout has no horizontal overflow.
- Share-card PNG generated and visually checked from explicitly fictional local-only inputs, without writing test posts to production.
- Authenticated community behavior is covered by PostgreSQL tests; no real-user session was used to create public test posts in the browser.
- Build and TypeScript checks passed.

## Popijeme a katalog od uživatelů — 2026-10-30

- Na produkci ověřen titulek i manifest „Popijeme — sociální síť na pivo“. Nasazený JavaScript obsahuje nové texty Popijeme a nabídku piv od uživatelů, bez textů Pivogram a výchozího katalogu.
- GitHub main: bed749c6a6c021107d78c28f8c0fe9f3398163f0 (manifest), navazuje na 96e0bfb2ba8722a2672bcc6e234fe20d005eb078 (rozhraní a BeerPicker) a 8553e3c118478a2ac3f8cbab60b79167b8b121f5 (metadata).
- Supabase migrace 20261030213545 user_catalog_only aplikována. Odstraněno 187 předvyplněných produktů bez uživatelských vazeb; obnovitelná kopie v private.removed_seed_catalog bez klientských oprávnění.
- Po migraci ověřeno: 1 produkt Bernard Nefiltrovaná 12, 1 zachovaný uživatelský zápis. Nová piva dál přidává stávající trigger.
- Lokální build/testy nespuštěny (Node.js není dostupný). Automatické nasazení dodalo funkční nové HTML, JavaScript a manifest.
- SQL soubor odpovídá migraci 20261030213545 z historie Supabase. Při nasazování již existující databáze migraci znovu nespouštět.


## Klub Popijeme 0.4 — 2026-10-30

- TypeScript a produkční Vite sestavení prošly. Vite aktualizován na 8.3.5; kontrola závislostí po aktualizaci nehlásila zranitelnosti.
- Databázové testy PGlite: původní izolace deníku a komunity i nové testy tří identit a anonymní role prošly. Pokryté jsou čekající/přijatá přátelství, odebrání i vypršení pobytu, soukromé město, cizí pozvánky, neoprávněné a duplicitní potvrzení účasti, soukromé fotky a jejich vlastnictví, nepodložený štítek, trvalé odznaky, opakované vyhodnocení a nezávislost odměn na množství.
- Funkční průchod přes skutečný supabase-js klient do místního PGlite/PostgREST adaptéru: přihlášení dvou smyšlených účtů, nahrání PNG a převod do JPEG, fotopříspěvek, pěnové oznámení a odemčení Objevitele, nastavení štítku a soukromého města, záložka z cizího příspěvku do vlastní sekce přání, hledání přezdívky, sledování, odeslání a přijetí žádosti, sdílení pobytu, zobrazení přítele v podniku, soukromá pozvánka a potvrzení adresátem.
- Mobilní kontrola při šířce 390 CSS px: bez horizontálního přetékání obsahu. Navigace obsahuje pět voleb včetně Více; žebříček má vlastní sekci a v pasu není. Cedule, filtry a pěnové oznámení byly vizuálně ověřené.
- Produkční databáze: migrace social_club a badge_copy aplikované, 167 definic, bucket pro fotky soukromý. Původní jeden záznam a jediné skutečné pivo zůstaly zachované; žádné testovací příspěvky se do produkce nevkládaly.
- Bezpečnostní kontrola po hlavní migraci nepřidala nálezy; zůstávají dříve popsaná upozornění na záměrný opt-in žebříček a ochranu uniklých hesel (aplikace používá Google).
- Ověřena shoda všech 167 metrik, cílů a českých popisů mezi zdroji a produkční databází pomocí kontrolního součtu.
- Sdílecí odkaz na přítele ověřen i při přihlášení: po místním OAuth návratu se obnoví hledaný kód a odpovídající profil, bez automatického odesílání žádosti.

## Více příjemců události — 31. 10. 2026

`npm test` a `npm run build` prošly. Databázový test ověřuje dva příjemce jedné události, deduplikaci, samostatná oznámení, nezávislé přijetí/odmítnutí, zákaz odpovědi za jiného, skrytí před cizím účtem a anonymním návštěvníkem, odmítnutí prázdného seznamu / sebe / nepřátel / null a kompatibilitu starého klienta. Zrušení události odstraní související odpovědi i oznámení. Místní prohlížeč ověřil povinný výběr, jednotlivá zaškrtávátka, vybrat vše/zrušit výběr a uložení jedné skupinové události přes API. Testovací data vznikala pouze v místní fixture.

Kontrola Supabase: žádné nové upozornění k této migraci. Existující výjimky zůstávají: záměrný agregační RPC žebříčku (`SECURITY DEFINER`, pouze uživatelé s opt-in) a vypnutá kontrola uniklých hesel u aplikace používající Google přihlášení. [Kontrola funkcí](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [kontrola hesel](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Oprava potvrzení účasti — 31. 10. 2026

Produkční log potvrdil `permission denied for table beer_rsvps`. PostgREST upsert přiděluje i stejné hodnoty konfliktních klíčů (`meetup_id`, `user_id`), zatímco původní oprávnění dovolovalo aktualizovat pouze `status`. Původní místní fixture klíče při upsertu vynechávala, takže chybu nezachytila.

Migrace `20261031152214_fix_rsvp_upsert_permissions.sql` povoluje přiřazení těchto klíčů a trigger současně zakazuje změnit jejich hodnoty. RLS zůstává aktivní. Regresní test nyní provádí přesný upsert včetně klíčů: před opravou selhal shodnou chybou, po opravě prošel při prvním uložení, změně a opakování odpovědi. Pokusy přesunout odpověď na jinou událost nebo osobu jsou odmítnuté. Celé `npm test` prošlo. Migrace je aplikovaná v produkci; není potřeba nové sestavení rozhraní.

## Odpočet potvrzených událostí — 31. 10. 2026

TypeScript a produkční sestavení prošly. Místní prohlížeč ověřil zobrazení po potvrzení účasti skutečným API upsertem ve fixture, změnu vteřin (58 → 52), čitelnost na šířce 390 px a odpočet v kalendáři. Odečítá se od absolutního termínu pomocí Date.now(), nikoli počítáním tiků. Interval se uklízí při skrytí komponenty a zastaví po dosažení termínu; při návratu do karty se čas přepočítá. Čtečky obrazovky nedostávají oznámení každou vteřinu. Testovací událost i potvrzení jsou pouze v místní fixture.

## Nová nástěnka a profily — 31. 10. 2026

Postup ověření: přes místní rozhraní vytvořen Post na lok bez pivních údajů, doplněno nepovinné město, uložen komentář a ověřen serverový filtr města. Přehled lidí otevřel cizí profil, který zobrazil jen veřejný základ a vysvětlení přátelství. Vlastní profil umožnil uložit medailonek a město a ihned je zobrazil. Kontrolováno rozložení se dvěma bočními panely a mobilní šířka 390 px, spodní menu, profil i nabídka Více. Všechny tyto zápisy byly výhradně v místní fixture.

Rozšířené databázové testy ověřují veřejný adresář přezdívek, medailonek/město pouze pro přátele, veřejné/pro přátele/soukromé rychlé příspěvky v jednotné nástěnce, zákaz podvržení autora, komentáře a odpovědi, reakce, oznámení a skrytí po odebrání přátelství. Založení rychlého příspěvku nemění pivní statistiky. Kontrolována i ochrana odpovědí napříč příspěvky.

## Žebříček a zavináč — 31. 10. 2026

Regresní test žebříčku používá 53 účastníků: uživatel s jednou značkou a 12 pivy se nevejde do prvních 50 podle značek, ale správně vede režim počtu piv. Kontrolováno sčítání opakované značky, odebrání souhlasu, souhrnný výstup bez identifikátorů a zákaz anonymního přístupu. V prohlížeči se pořadí přepnulo mezi testovacím Márou (4 značky, 4 piva) a Karlem (1 značka, 6 piv).

Testy označení ověřují mezery a vykřičník, velikost písmen, potlačení prefixových falešných shod, opakovaná a vlastní označení, komentáře a skrytí oznámení mimo povolené publikum. Místní prohlížeč ověřil nabídku po @, výběr člověka, uložený odkaz na správné UUID, reset formuláře a oznámení na druhém testovacím účtu. Tabulkové RPC v místní fixture byly zpřesněné na SELECT * FROM funkce, aby vracely stejný JSON jako PostgREST.

Nový agregovaný RPC má záměrně stejný model SECURITY DEFINER jako původní žebříček: vrací jen součty dobrovolných účastníků, vyžaduje auth.uid(), má prázdný search_path a anon nemá EXECUTE. Advisor na tento záměrný veřejný agregační endpoint upozorňuje; citlivé řádky se přes něj nevracejí. [Popis kontroly funkcí](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
