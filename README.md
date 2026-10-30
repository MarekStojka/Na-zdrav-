# Pivogram — sociální síť na pivo

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
- `beer_catalog`: společná databáze piv, počátečních 188 položek. Nová piva doplňuje serverový trigger ze zápisů. Normalizované jméno a pivovar jsou unikátní; klienti nemohou přepisovat společné produkty.
- `beer_library`: security-invoker view. Souhrnné hodnocení pouze z veřejných ochutnávek: nejprve průměr známek každého uživatele, potom průměr uživatelů. Nula znamená bez hodnocení. Každý uživatel tedy váží stejně bez ohledu na počet zápisů.
- `beer_feed`: security-invoker view veřejných ochutnávek s přezdívkou, množstvím, datem, poznámkou, místem a počtem reakcí. E-maily nejsou součástí této datové vrstvy. Stránkování po 50 příspěvcích; sdílený odkaz `/?post=<uuid>` načte konkrétní veřejný zápis.
- `beer_cheers`: unikátní reakce Na zdraví! na příspěvek a uživatele. Reagovat lze pouze na veřejný příspěvek. Odebrat lze jen vlastní reakci; reakce na skrytý příspěvek nejsou veřejné.
- `beer_wishlist`: soukromý seznam Chci ochutnat; RLS pouze pro vlastníka.
- `beer_places`: uložené podniky s názvem/městem a volbou viditelnosti, úpravy pouze vlastníkem. `beer_venues` agreguje veřejné návštěvy a veřejně uložené podniky. Mapa je externí odkaz; aplikace nezjišťuje GPS a nevyžaduje placené mapové API.
- `beer_profiles`: přezdívka vlastníka, veřejně čitelná, pokud má veřejnou ochutnávku. Žebříček dále vyžaduje dobrovolný souhlas `listed`.
- Pivní pas: šest odznaků podle různých piv, stylů, pivovarů, hodnocených piv a navštívených míst. Bez odměn za vypité množství. PNG kartička 1080×1350 obsahuje jen přezdívku a souhrn objevů, bez míst, dat a poznámek.

Migrace jsou v `supabase/migrations/`. `npm test` ověřuje základní izolaci i veřejnou komunitu, soukromé zápisy/přání, deduplikaci, váhu hodnocení, reakce a oprávnění vlastníků na dvou účtech a anonymní roli pomocí PGlite. Export vlastního deníku je JSON. Starší zápisy z prototypu Sites se nepřenášejí automaticky.

## Vzhled

Retro styl inspirovaný českými pivními etiketami a zápalkovými nálepkami. Vlastní vektorová ilustrace `public/retro-toast.svg`, texturovaný krémový papír a cihlová/petrolejová paleta. Fonty jsou obsluhované z `public/fonts/` včetně licencí SIL OFL. UI je responzivní, formuláře mají čistý kontrastní podklad.

Aplikace vyžaduje internet. Manifest umožňuje přidání na plochu; nejde o publikaci v obchodech s aplikacemi. Přidání kontaktních údajů provozovatele, informací o soukromí a způsobu žádosti o odstranění účtu zůstává k doplnění podle skutečných údajů provozovatele.
