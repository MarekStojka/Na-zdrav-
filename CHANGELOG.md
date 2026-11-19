# Changelog

Všechny změny viditelné pro uživatele. Verze podle [SemVer](https://semver.org/lang/cs/):
oprava nebo drobnost = patch (0.5.1), nová funkce = minor (0.6.0). Každé vydání má git tag `vX.Y.Z`.
Vrácení změny: `git revert <commit>`; migrace databáze se revertem nevracejí.

## [Unreleased]

### Změněno
- „Chci ochutnat“ je jednoduchý seznam piv ve stejném vzhledu jako knihovna: pivo, pivovar, styl, hodnocení a tlačítka Fotky, Odebrat ze seznamu a Zapsat. Zmizely karty, řazení a filtry.

## [0.10.0] — 2026-11-19

### Změněno
- Knihovna piv je jednoduchý průchod. Výchozí je seznam pivovarů s počtem piv, klepnutím na pivovar se ukážou jeho piva (hodnocení, „mám ochutnáno“, tlačítka Zapsat, Chci ochutnat a Fotky) a tlačítkem „‹ Všechny pivovary“ se vrátíš. Nahoře je jedno hledání, které najde pivovar i pivo napříč vším, a výběr stylu. Knihovna ukazuje i předvolená piva, která ještě nikdo nezapsal. Zmizely karty, řazení a filtry „Alespoň 3 hodnotitelé / Ještě jsem neměl“. Seznam „Chci ochutnat“ zůstává beze změny.

## [0.9.2] — 2026-11-19

### Změněno
- Předvolby piv jsou aktualizované: 402 piv od 47 českých pivovarů a značek (dříve 188 od 18). Jen současná nabídka, bez ukončených piv. Nově např. Starobrno, Zlatopramen, Březňák, Hostan, skupina Lobkowicz (Lobkowicz, Platan, Klášter, Rohozec, Ježek, Černá Hora, Janáček), Krakonoš, Chodovar, Konrad, Žatec, Postřižinské, Regent, Hubertus, Bakalář, Novopacké, Pardál, Braník a privátní značky Bruncvík, Staročech a Trumf. Zdroje jsou v supabase/catalog-sources.md.

## [0.9.1] — 2026-11-19

### Změněno
- Post na lok (textový příspěvek bez piva) už nejde napsat. Všechno se píše jako ochutnávka, která jde uložit s fotkou i bez ní. Pole „Co dnes piješ? Zapiš ochutnávku…“ na nástěnce otevře zápis piva, v „+“ zůstala Ochutnávka a Pozvánka. Starší Posty na lok zůstávají na nástěnce i s komentáři.

## [0.9.0] — 2026-11-19

### Změněno
- Formulář zápisu se už neptá „Točené / Lahvové“, je to vidět z fotky. Způsob podání se nevypisuje ani u příspěvků a v deníku. Nové zápisy se ukládají jako „neuvedeno“, starší údaje v databázi zůstávají a ukazují se už jen v historii piv u podniku.

### Přidáno
- Označení piva nabízí předvolby piv velkých českých pivovarů, ne jen piva, která už někdo zapsal. Stačí napsat kus názvu nebo pivovaru, na pořadí slov nezáleží („cerny kozel“ najde Kozel Černý). Po uložení se předvolené pivo samo přidá do společné knihovny.

## [0.8.0] — 2026-11-19

### Změněno
- Desktop (od 701 px) vypadá jako Facebook: nástěnka je sloupec 600 px s bílými zaoblenými kartami a jemným stínem. Nahoře je autor, pod ním text (pivo, pivovar, místo, poznámka), pak čtvercová fotka a pod ní řádek tlačítek přes celou šířku (Na zdraví!, komentáře, Taky ochutnat, uložit, sdílet). Na mobilu zůstává pořadí jako na Instagramu.
- Objevuj je mřížka fotek po třech v řádku jako na Instagramu. Klepnutím na fotku se otevře proud od té fotky (autor, pivo, podnik, Na zdraví!, komentáře, sdílení), tlačítkem „← Fotky“ v horní liště se vrátíš do mřížky na stejné místo. Hledání a filtry podle piva a podniku zůstávají.

## [0.7.0] — 2026-11-19

### Přidáno
- **Objevuj**, obdoba reels z Instagramu: veřejné ochutnávky s fotkou jako svislý proud přes celou výšku obrazovky. Na fotce je autor, pivo s pivovarem, podnik, hodnocení a poznámka, vpravo „Na zdraví!“, komentáře a sdílení. Klepnutím na pivo nebo podnik se proud vyfiltruje, nahoře je hledání „Pivo, pivovar nebo podnik“. Funguje i bez přihlášení. V knihovně a v místech má každé pivo a podnik odkaz „Fotky“.

### Změněno
- Spodní lišta na mobilu: místo „Lidé“ je „Objevuj“, Lidé u stolu jsou v menu Více. Na desktopu je Objevuj v levém menu pod Nástěnkou.

## [0.6.0] — 2026-11-19

### Změněno
- Desktop má stejný čistý vzhled jako mobil: ploché zaoblené karty a tlačítka, kulaté avatary, nadpisy stránek bez ozdob, statistiky jako řada čísel, filtry v jednom řádku, lidé jako seznam, kompaktní podniky a stránka Parťáci. Postranní panely jsou čisté (bez retro rámečků a nakloněné „poznámky“), levé menu má normální písmo a zvýrazněnou aktivní položku.
- Na desktopu je nástěnka sloupec široký 470 px uprostřed, jako na Instagramu. Fotka jde přes celou šířku karty a karta s fotkou má 808 px místo 911 px na výšku a 470 místo 769 px na šířku.

## [0.5.8] — 2026-11-19

### Opraveno
- Přihlášení otevřené z Facebooku, Instagramu nebo Messengeru vysvětlí, že tam Google přihlášení nepovolí. Nabídne „Otevřít v prohlížeči“ (na Androidu tlačítko „Otevřít v Chrome“) a „Zkopírovat odkaz“.
- Klávesnice na mobilu už nepřekrývá dialogy (profil a přezdívka, zápis piva, Post na lok, pozvánka). Dialog je na mobilu přes celou obrazovku a jeho výška se přizpůsobí místu nad klávesnicí. Pole, do kterého píšeš, se posune doprostřed. Spodní lišta se při psaní schová.

## [0.5.7] — 2026-11-19

### Změněno
- Parťáci: seznam přátel je hned pod hledáním. „Právě sedím tady“ je pod ním jako jeden řádek „Ukaž přátelům, kde sedíš · Sdílet“ a formulář s podnikem a městem se otevře až po klepnutí (s tlačítkem Zrušit). Přátelé začínají na mobilu na 366 px.
- Parťáci: místo velkého zeleného boxu „Tvůj kód ke stolu“ je jeden řádek s kódem a tlačítkem „Pozvat kamaráda“ (sdílí odkaz). Políčko s odkazem se ukáže jen tehdy, když sdílení ani kopírování nevyjde. Hledání přítele je jedno pole s nápovědou, úvod stránky je kratší.

## [0.5.6] — 2026-11-19

### Změněno
- Karty podniků jsou na mobilu kompaktní: název nahoře, pod ním město a čísla šedě, akce v klidných řádcích bez ikony a dělicích čar. Nápověda „Nastav si město v profilu“ je na mobilu skrytá.
- Lidé jsou na mobilu jednoduchý seznam (kulatý avatar a jméno, klepnutím na řádek se otevře profil) místo velkých dlaždic s „Otevřít profil ↗“. Lupa ve vyhledávání je vedle pole. Karta přítele je kompaktní (118 místo 170 px): jméno a kód, malé tlačítko „Pozvat na pivo“, „Sledovat“ a nenápadné „Odebrat přítele“ vpravo nahoře.
- Filtry (např. „Místa od komunity / Moje návštěvy / …“, filtry knihovny) jsou na mobilu v jednom řádku, který jde posunout do strany. Nelámou se do dvou řádků.
- Statistiky nad deníkem a pasem jsou na mobilu kompaktní čísla ve třech sloupcích jako počty na profilu Instagramu (bez ikon a dlouhých popisků). Místo 267 px zabírají 111 px.
- Stránky na mobilu začínají rovnou nadpisem. Zmizely malé nápisy nad nadpisy (např. „Malá mapa velkých chutí“), čára pod nadpisem a druhý vysvětlující odstavec, úvod je jeden krátký řádek. Nadpisy mají jednotné písmo.
- Na mobilu má celá aplikace čistý plochý vzhled jako Instagram nebo Facebook. Karty a tlačítka nemají tvrdé rámečky ani posunuté stíny, mají zakulacené rohy a jemný okraj. Avatary jsou kulaté, karty událostí nemají „lepicí pásky“ a obalové panely stránek (události, pas, žebříček) zmizely. Desktop zůstává v retro stylu.

### Opraveno
- Menu Více se po klepnutí na „Můj profil“ zavře. Dřív zůstalo otevřené přes profil.

## [0.5.5] — 2026-11-19

### Změněno
- Deník má karty ve stejném čistém stylu: fotka (nebo jednoduchá barevná dlaždice s půllitrem), název piva s pivovarem, šedý řádek (datum, hvězdičky, styl, točené/lahvové, množství), místo a poznámka. Dole je jediný řádek s viditelností a ikonami pro komentáře, „zapsat znovu“ a smazání. Na mobilu je deník seznam s náhledem vlevo místo dvou úzkých sloupců, karta má asi 133 px.
- Příspěvky bez fotky na nástěnce mají stejný čistý popis jako příspěvky s fotkou (název, šedý řádek, místo, poznámka) místo ilustrace etikety a velkého nadpisu. Na mobilu jsou zhruba o polovinu nižší. Z karet zmizely dělicí čáry pod autorem a nad akcemi. „Způsob neuveden“ se už nevypisuje.

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
