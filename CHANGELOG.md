# Changelog

Všechny změny viditelné pro uživatele. Verze podle [SemVer](https://semver.org/lang/cs/):
oprava nebo drobnost = patch (0.5.1), nová funkce = minor (0.6.0). Každé vydání má git tag `vX.Y.Z`.
Vrácení změny: `git revert <commit>`; migrace databáze se revertem nevracejí.

## [Unreleased]

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
