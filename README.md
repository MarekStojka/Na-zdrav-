# Na zdraví! — pivní zápisník

Samostatná aplikace React/Vite + Supabase, veřejně na https://na-zdravi.vercel.app/. Zdrojový kód v tomto repozitáři automaticky nasazuje Vercel z větve `main`.

## Přihlášení

Přihlášení i vytvoření účtu probíhá přes Google pomocí Supabase OAuth. V Supabase musí být zapnutý Google provider a nastavený Client ID a Client Secret ze stejného webového OAuth klienta. Client Secret patří pouze do Supabase, nikdy do klientského kódu, proměnných VITE ani repozitáře.

- Google JavaScript origin: `https://na-zdravi.vercel.app`
- Google redirect URI: `https://akllmenvonrwkqdejifo.supabase.co/auth/v1/callback`
- Supabase Site URL: `https://na-zdravi.vercel.app`
- Povolený návrat: `https://na-zdravi.vercel.app/`
- Pro přístup veřejnosti je v Google Auth Platform potřeba odpovídající External audience a produkční stav aplikace.

Není potřeba vlastní SMTP. Soukromý deník nevyžaduje přezdívku. Žebříček je dobrovolný a používá přezdívky, nikoli e-maily.

## Lokální vývoj

Zkopírujte `.env.example` do `.env` a doplňte veřejnou URL a publishable klíč projektu Supabase. Nikdy nepoužívejte service-role/secret klíč v prohlížeči.

```sh
npm ci
npm run dev
npm run build
```

Lokální přihlášení vyžaduje povolit konkrétní lokální návratovou adresu v Supabase. Vite konfigurace dovoluje také interní náhled na hostu `terminal.local`.

## Data

- `beer_entries`: vlastní zápisy; RLS omezuje čtení, vložení a smazání podle `auth.uid()`.
- `beer_profiles`: vlastní přezdívka a dobrovolný souhlas se zobrazením v žebříčku.
- `beer_leaderboard()`: pouze přihlášeným vrací nejvýše 50 přezdívek a počtů různých ochutnaných produktů. Nevrací e-maily, ID ani soukromé zápisy.
- Katalog obsahuje 188 položek s uvedenými zdroji, včetně sezónních a archivních produktů. Není kompletním seznamem piv v ČR.
- Export vlastního deníku je JSON. Starší zápisy z prototypu Sites se nepřenášejí automaticky.

Databázová migrace je v `supabase/migrations/`. Izolaci uživatelů ověřuje `npm test` pomocí PGlite.

## Vzhled

Retro styl inspirovaný českými pivními etiketami a zápalkovými nálepkami. Vlastní vektorová ilustrace `public/retro-toast.svg`, texturovaný krémový papír a cihlová/petrolejová paleta. Fonty jsou obsluhované z `public/fonts/` včetně licencí SIL OFL. UI je responzivní, formuláře mají čistý kontrastní podklad.

Aplikace vyžaduje internet. Manifest umožňuje přidání na plochu; nejde o publikaci v obchodech s aplikacemi. Přidání kontaktních údajů provozovatele, informací o soukromí a způsobu žádosti o odstranění účtu zůstává k doplnění podle skutečných údajů provozovatele.
