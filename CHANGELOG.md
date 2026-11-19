# Changelog

Všechny změny viditelné pro uživatele. Verze podle [SemVer](https://semver.org/lang/cs/):
oprava nebo drobnost = patch (0.5.1), nová funkce = minor (0.6.0). Každé vydání má git tag `vX.Y.Z`.
Vrácení změny: `git revert <commit>`; migrace databáze se revertem nevracejí.

## [Unreleased]

## [0.5.4] — 2026-11-19

### Změněno
- Příspěvek s fotkou má čistý popis jako na Instagramu. Hned pod fotkou je řádek akcí, pod ním název piva s pivovarem, jeden šedý řádek (hvězdičky, točené/lahvové, množství), místo a poznámka bez uvozovek. Zmizel velký nadpis, červené „Zatím bez hodnocení“ a ilustrace etikety. Karta je na mobilu kratší o dalších 50–120 px podle obsahu. Příspěvky bez fotky zůstávají beze změny.

## [0.5.3] — 2026-11-19

### Opraveno
- Na mobilu má avatar v hlavičce dotykovou plochu 44 px. Výběr stylu a řazení v knihovně jsou pod sebou, takže se „Nejlépe hodnocená“ už neořízne.

### Změněno
- Menu Více na mobilu má ztmavené pozadí. Zavře se klepnutím vedle nebo klávesou Esc, ne jen tlačítkem Více.
- Červené tlačítko + je na mobilu ve spodní liště mezi Knihovnou a Místy, jako na Instagramu. Už nevisí nad příspěvky a nezakrývá ikonu sdílení. Nabídka (Post na lok, ochutnávka, pozvánka) se otevírá nad ním. Nepřihlášení lištu mají beze změny.
- Filtr města na nástěnce je přepínač „Město“ vedle „Všechno / Moji parťáci“. Pole pro město se otevře až po klepnutí a přepínač pak ukazuje vybrané město. Na mobilu začíná první příspěvek o dalších 68 px výš.
- Komentáře se otevírají ikonou bublinky s počtem v řádku akcí pod příspěvkem, jako na Instagramu, u piv i u Postů na lok. Samostatný řádek „Komentáře (0)“ zmizel a karta s fotkou je na mobilu o 67 px nižší. „Taky ochutnat“ je na mobilu jen ikona +, aby se akce vešly do jednoho řádku.

## [0.5.2] — 2026-11-19

### Změněno
- Hlavička nástěnky je na mobilu kompaktní. První příspěvek začíná o 144 px výš (463 místo 607 px) a fotka je vidět hned bez posouvání. Pole „Co máš na jazyku?“ otevírá Post na lok, takže zdvojené červené tlačítko je na mobilu skryté. „Zapsat pivo“ a „Pozvat partu“ jsou vedle sebe.
- Příspěvek s fotkou už vedle názvu piva nekreslí ilustraci etikety „Poctivě ochutnáno“. Fotka ji nahrazuje, karta je přehlednější a název piva má celou šířku. Příspěvky bez fotky ilustraci mají dál.

### Opraveno
- Tlačítka na mobilu jsou aspoň 44 px, aby se trefila prstem: akce pod příspěvkem (ikony „Chci ochutnat“ a „Sdílet“ měly 17 × 29 px), filtry, akce v knihovně a místech a stránkování lidí.
- iPhone už při klepnutí do pole (hledání, město, podnik, řazení) nepřibližuje stránku. Pole mají na mobilu písmo 16 px.

## [0.5.1] — 2026-11-19

### Změněno
- Fotky u příspěvků mají jednotný formát na výšku 4:5 jako na Instagramu. Na mobilu vyplní celou šířku karty, na desktopu mají nejvýš 540 px. Ořez je jen při zobrazení (na střed), uložený originál zůstává celý. Stejný formát má zápisník i náhled při nahrávání.

## [0.5.0] — 2026-10-31

Shrnutí dosavadní historie, podrobnosti v `README.md` a `VALIDATION.md`.

- Podniky a konverzace: tři úrovně publika příspěvků, komentáře s odpověďmi, oznámení, hodnocení podniků, štamgasti, osobní kalendář.
- Více pozvaných přátel na jedné události, živý odpočet potvrzených událostí.
- Jedna hlavní nástěnka, profily, adresář lidí a textové příspěvky Post na lok.
- Dva žebříčky (značky / počet piv) a označování lidí přes @.
- Opravy: potvrzení účasti (RSVP upsert), mobilní dialogy překrývaly spodní navigaci.

## [0.4.0] — 2026-10-30

- Klub Popijeme: pivní pas se 167 odznaky, profilové štítky, fotky u příspěvků, přátelé a sledování, „Jsem tady“, pozvánky, statistiky a seznam Chci ochutnat.
- Přejmenování Pivogram → Popijeme, katalog piv plněný uživateli.
- Retro vzhled podle českých pivních etiket, přihlášení přes Google.
