# Katalog piv (předvolby)

Předvolby pro označení piva ve formuláři zápisu (`src/beer-catalog.json`). Aktualizováno 19. 11. 2026: 402 piv od 47 pivovarů a značek. Rešerše současné nabídky z oficiálních webů pivovarů (kde web seznam nemá, z e-shopu pivovaru nebo prodejce). Úplnost značek zkontrolována proti seznamu piv na kupi.cz.

Pravidla: jen piva prodávaná v Česku v roce 2026, bez ukončených a jednorázových edic. Balení (plech, lahev, sud) nejsou samostatné produkty. Styly jsou hrubé kategorie aplikace: ležáky i výčepní = Ležák, nealko = Nealkoholické, IPA/APA, pšeničné, stout/porter, ostatní (silné speciály, ochucená, radlery s alkoholem) = Jiné.

Méně jisté zdroje: Březňák (web blokuje přístup, část z Heinekenu a sekundárních zdrojů), Regent (výpis exportérů CzechTrade 2024), Rychtář (e-shop Pivobod), Staročech, Trumf a Bruncvík (privátní značky Penny, Billa a Kaufland; výrobci podle Pivníci.cz: Nymburk, neuvedeno, Platan). Pernštejn vynechán (výroba v Pardubicích skončila 2023, současná nabídka nepotvrzena).

Předvolené pivo se do databáze zapíše až prvním zápisem (trigger `private.link_beer_catalog`), migrace není potřeba.

## Pivovary a zdroje

- **Bakalář** (13): https://www.pivobakalar.cz/produkty/asterie-cerise, https://www.pivobakalar.cz/produkty/desitka, https://www.pivobakalar.cz/produkty/desitka-rezana, https://www.pivobakalar.cz/produkty/desitka-tmava, https://www.pivobakalar.cz/produkty/jedenactka, https://www.pivobakalar.cz/produkty/letni-special, https://www.pivobakalar.cz/produkty/lezak, https://www.pivobakalar.cz/produkty/medovy-special, https://www.pivobakalar.cz/produkty/nealko-za-studena-chmelene, https://www.pivobakalar.cz/produkty/rakovnicky-lezak-za-studena-chmeleny, https://www.pivobakalar.cz/produkty/svatovaclavsky-special, https://www.pivobakalar.cz/produkty/vanocni-special, https://www.pivobakalar.cz/produkty/velikonocni-special
- **Bernard** (18): https://www.bernard.cz/cs/nase-piva/cepovane, https://www.bernard.cz/cs/nase-piva/lahvove
- **Birell** (14): https://www.prazdroj.cz/znacka/birell
- **Braník** (4): https://www.branik.cz/pivo
- **Bruncvík** (7): https://prodejny.kaufland.cz/sortiment/nase-znacky/bruncvik.html
- **Budějovický Budvar** (7): https://www.budejovickybudvar.cz/sortiment/budvar-33, https://www.budejovickybudvar.cz/sortiment/budvar-reserve, https://www.budejovickybudvar.cz/sortiment/budweiser-budvar-classic, https://www.budejovickybudvar.cz/sortiment/budweiser-budvar-nealko, https://www.budejovickybudvar.cz/sortiment/budweiser-budvar-original, https://www.budejovickybudvar.cz/sortiment/budweiser-budvar-tmavy-lezak, https://www.budejovickybudvar.cz/sortiment/redix
- **Březňák** (3): https://www.heinekenceskarepublika.cz/nase-znacky/
- **Chodovar** (8): http://chodovar.cz/id1012cz-novinky.htm, http://chodovar.cz/id1060cz-pivo.htm
- **Elektrárna** (5): https://www.prazdroj.cz/znacka/elektrarna
- **Excelent** (1): https://www.prazdroj.cz/znacka/excelent
- **Ferdinand** (14): https://www.pivovarferdinand.cz/nealko/, https://www.pivovarferdinand.cz/sezonni-specialy/, https://www.pivovarferdinand.cz/stala-nabidka/
- **Gambrinus** (5): https://gambrinus.cz/cs/portfolio, https://www.prazdroj.cz/znacka/gambrinus
- **Holba** (5): https://www.holba.cz/ryzi-piva
- **Hostan** (2): https://www.hostan.cz/pivo
- **Hubertus** (11): https://pivovarkacov.cz/pivo/kacovska-sestra/, https://pivovarkacov.cz/pivo/l-p-1457-horky-lezak/, https://pivovarkacov.cz/pivo/nealkoholicke-pivo/, https://pivovarkacov.cz/pivo/svetle-pivo-vycepni-nefiltrovany/, https://pivovarkacov.cz/pivo/svetle-pivo-vycepni/, https://pivovarkacov.cz/pivo/svetly-lezak-medium-nefiltrovany/, https://pivovarkacov.cz/pivo/svetly-lezak-medium/, https://pivovarkacov.cz/pivo/svetly-lezak-premium-nefiltrovany/, https://pivovarkacov.cz/pivo/svetly-lezak-premium/, https://pivovarkacov.cz/pivo/tmavy-specialni-lezak-nefiltrovany/, https://pivovarkacov.cz/pivo/tmavy-specialni-lezak/
- **Janáček** (3): https://www.pivobod.cz/kategorie-produktu/uhersky-brod/
- **Ježek** (5): https://www.pivobod.cz/kategorie-produktu/jezek/
- **Klasik** (1): https://www.prazdroj.cz/znacka/klasik
- **Klášter** (4): https://www.pivobod.cz/kategorie-produktu/klaster/
- **Kocour** (19): https://shop.pivovar-kocour.cz/nase-piva/
- **Konrad** (15): https://www.pivo-konrad.cz/nase-piva
- **Krakonoš** (5): https://www.pivovar-krakonos.cz/inpage/pivo-krakonos/
- **Krušovice** (8): https://www.krusovice.cz/cs/nase-piva
- **Litovel** (14): https://www.litovel.cz/nase-piva
- **Lobkowicz** (12): https://www.pivobod.cz/kategorie-produktu/lobkowicz/, https://www.pivobod.cz/kategorie-produktu/max-x/, https://www.pivobod.cz/kategorie-produktu/pivni-speciality/, https://www.pivobod.cz/kategorie-produktu/refresh/
- **Novopacké** (12): https://www.novopackepivo.cz/produkty/tuzemske-produkty/
- **Ostravar** (6): https://www.ostravar.cz/pivo/
- **Pardál** (2): https://www.budejovickybudvar.cz/sortiment/pardal-3, https://www.budejovickybudvar.cz/sortiment/pardal-echt
- **Platan** (5): https://www.pivobod.cz/kategorie-produktu/platan/
- **Plzeňský Prazdroj** (4): https://www.prazdroj.cz/znacka/master, https://www.prazdroj.cz/znacka/pilsner-urquell, https://www.prazdroj.cz/znacka/proud
- **Postřižinské** (10): https://www.postriziny.cz/piva
- **Primus** (1): https://www.prazdroj.cz/znacka/primus
- **Primátor** (22): https://primator.cz/produkty/
- **Radegast** (6): https://www.prazdroj.cz/znacka/radegast
- **Regent** (10): https://exporters.czechtrade.gov.cz/pivovar-bohemia-regent-a-s
- **Rohozec** (14): https://www.pivorohozec.cz/pivo-rohozec
- **Rychtář** (9): https://www.pivobod.cz/kategorie-produktu/rychtar/
- **Starobrno** (5): https://www.starobrno.cz/nase-pivo
- **Staropramen** (7): https://www.staropramen.cz/pivo
- **Staročech** (4): https://www.kupi.cz/sleva/pivo-polotmavy-lezak-starocech, https://www.kupi.cz/slevy/pivo?br528=528, https://www.pivnici.cz/piva-varena-pro/penny/, https://www.pivnici.cz/pivo/starocech-nealkoholicke-pivo-svetle/
- **Svijany** (23): https://www.pivovarsvijany.cz/svijanske-pivo/
- **Trumf** (2): https://www.billa.cz/produkt/trumf-10-pivo-vycepni-svetle-05l-82363349, https://www.billa.cz/produkt/trumf-11-pivo-svetly-horky-lezak-05l-82363348
- **Velkopopovický Kozel** (9): https://www.kozel.cz/cs/nase-piva
- **Zlatopramen** (12): https://www.zlatopramen.cz/nase-produkty
- **Zubr** (5): https://www.zubr.cz/nase-piva
- **Černá Hora** (13): https://pivo-cernahora.cz/2026/09/22/%f0%9f%8d%ba-svatovaclavsky-lezak-special-ktery-patri-k-podzimu/, https://pivo-cernahora.cz/2026/10/13/special-harmonie/, https://pivo-cernahora.cz/2026/11/09/svatomartinsky-special-dorazil/, https://www.pivobod.cz/kategorie-produktu/cerna-hora/
- **Žatec** (18): https://sedmyschod.com/pivo-winter-ale/, https://sedmyschod.com/produkty/

## Duplicity od uživatelů (od 21. 11. 2026)

Když někdo zapíše pivo pod jiným názvem než oficiálním („Budvar · Budvar 10“ místo „Budějovický Budvar · Budvar Výčepní“):

1. `npm run duplicity` vypíše kandidáty (čte jen veřejnou knihovnu z produkce) a k nim hotové SQL.
2. Po kontrole se SQL spustí v Supabase SQL Editoru: `private.merge_beer(staré pivo, starý pivovar, pivo, pivovar, styl, zdroj)`
   sloučí jedno pivo, `private.merge_brewery(starý, nový)` celý pivovar. Zápisy se přejmenují, „Chci ochutnat“ se přesune,
   duplicitní řádek knihovny zmizí.
3. Sloučení se zapamatuje jako alias (`private.beer_aliases`, `private.brewery_aliases`): kdo to samé napíše znovu,
   uloží se mu rovnou oficiální název. Na nástěnce ani v knihovně tak duplicita nebude vidět.

Formulář při zápisu nového piva nabízí podobná piva z knihovny a našeptává známé pivovary, aby duplicit vznikalo co nejméně.
