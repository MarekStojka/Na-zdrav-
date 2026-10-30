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
