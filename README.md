# Na zdraví! — samostatná aplikace

React/Vite + Supabase. Bez přihlášení přes ChatGPT a bez závislosti na Sites. Zachovává kreslený design a katalog 188 piv.

## Stav

Zdrojový kód připraven. Databázová migrace je aplikovaná v potvrzeném projektu Supabase v organizaci Na zdraví!. Veřejné nasazení a doručování ověřovacích e-mailů zatím nejsou dokončené. Starší zápisy z prototypu Sites se sem automaticky nepřenášejí. Pro migraci je potřeba po přihlášení původního vlastníka bezpečně přiřadit jeho export k novému účtu, nikoliv kopírovat staré identifikátory uživatelů.

## Příprava nového projektu

1. Vytvořit nový samostatný projekt Supabase v EU. Nepoužít existující projekt s jinou aplikací.
2. V novém projektu aplikovat `supabase/migrations/20261030_pivni_app.sql` jako databázovou migraci.
3. Zapnout Email/Password Auth, potvrzování e-mailů a minimální délku hesla alespoň 8 znaků. Pro nezávislou aplikaci nepoužívat anonymní účty.
4. Nastavit vlastní SMTP pro ověřovací a obnovovací zprávy. Vestavěné testovací doručování Supabase má omezení a nelze bez ověření počítat s registrací libovolných externích adres. Před spuštěním otestovat doručení na dvě různé adresy a ověřit aktuální limity poskytovatele. Žádná rozesílací služba ani případné poplatky nejsou aktivované.
5. V Auth URL Configuration nastavit Site URL na finální HTTPS adresu a přidat přesné návratové adresy `/` a `/?recovery=1` na stejném hostu. Pro testování přidat přesnou lokální adresu. Produkčně nepoužívat neomezené wildcard domény.
6. Ve Vercelu vytvořit projekt pro tuto složku, Vite build, output `dist`.
7. Nastavit `VITE_SUPABASE_URL` a `VITE_SUPABASE_PUBLISHABLE_KEY`. Publishable/anon klíč je určený pro prohlížeč; zabezpečení zajišťují RLS pravidla. Nikdy sem nedávat service-role/secret klíč ani databázové heslo.
8. `npm ci` a `npm run build`. Nasadit, otestovat registraci, potvrzení e-mailu, přihlášení, obnovu hesla, odhlášení a izolaci dvou skutečných účtů.

## Lokální spuštění

Zkopírovat `.env.example` na `.env` a doplnit veřejnou konfiguraci nového projektu. `npm ci && npm run dev`.
Bez konfigurace se bezpečně zobrazí čekající stav; aplikace nevytváří falešné lokální účty.

## Data a přístup

- `beer_entries`: vlastní záznamy; RLS omezuje čtení, přidávání i mazání podle `auth.uid()`.
- `beer_profiles`: vlastní přezdívka a dobrovolná účast v žebříčku.
- `beer_leaderboard()`: pouze přihlášení, maximálně 50 přezdívek a počtů různých produktů se souhlasem. Nevrací e-maily, ID, poznámky ani objemy a počty vypitých piv.
- Katalog je statický JSON se zdroji, ne kompletní seznam piv v ČR. Obsahuje archivní a sezónní položky.
- Export deníku je JSON. Nezahrnuje hesla ani tokeny.

## Před ostrým provozem

Ověřit RLS na dvou testovacích účtech, SMTP doručování a návratové odkazy na produkční doméně. Přidat kontaktní údaje provozovatele, informace o zpracování osobních údajů a způsob žádosti o odstranění účtu. Kontaktní údaje nejsou v kódu smyšlené.

## Mobilní používání

Responzivní web s manifestem pro samostatné okno po přidání na plochu. Není to publikace v App Storu/Google Play a není implementován offline zápis; změny vyžadují internet.
