# Klink — nieuwe leesstappen in de bestaande app

## Correctie van de eerdere ombouw

De bestaande LearnerApp, TeacherApp, PackagePlayer en PackageExerciseBrowser zijn opnieuw de actieve app. De aparte CurriculumApp en de bijbehorende stylesheet zijn verwijderd; de eerdere werkversie is herstelbaar via commit 2721eff. De oorspronkelijke startpagina, navigatie, lespagina, oefenwerkruimte, woordkaarten en docentomgeving blijven het uitgangspunt. De UI-review van 16 oktober verbetert binnen die compositie de leesbaarheid, tikvlakken, feedback en labels; zij introduceert geen nieuw hoofdmenu.

## Eén inhoudelijke basis

De vastgezette Lexicon-editie klink-leerlijn-20261016-v1 blijft ongewijzigd. lib/taalroute-packages.ts zet die gegevens om naar het bestaande les- en oefencontract. Er is geen live afhankelijkheid van Drive of Lexicon.

- 337 woordvormen / 338 betekenissen; iedere betekenis heeft één eerste vindplaats in de woordenbank.
- 10 bouwgroepen met 37 basisleesstappen en 3 herhaalmomenten.
- 23 uitbreidingssets en 154 overige oefenwoorden.
- 78 langere woorden in vijf afzonderlijke leesroutes; 7 steunbetekenissen onder voorbereiding.
- Bekende, nieuwe en terugkerende woorden blijven ongewijzigd uit Lexicon overgenomen.

Er zijn 302 te openen routes: 40 basisonderdelen, 23 uitbreidingssets en 239 individuele woordroutes. Dit zijn niet 302 nieuwe didactische lijsten. De technische containers zijn de tien bouwgroepen, vijf leesroutes en één ondersteunend onderdeel; zij zijn niet afgeleid van de oude zestien pakketgrenzen.

## Bestaande oefenspelers

De koppeling levert na het fotoherstel 4.322 oefeninstanties in negen bestaande families: modelkaart, woord/beeld kiezen, koppelen, woordbouw, typen, nazeggen, schrijven, memory en woordkaarten. Dezelfde woordbetekenis kan in verschillende leesstappen terugkomen. Dit aantal is geen aantal unieke oefenvormen of bewezen beheerste doelen.

Iedere begeleide route gebruikt expliciete oefen-ID's. De oude zoekmatch op losse woorden en de beperking tot één opdracht per familie bepalen de nieuwe route niet meer. Eerst worden de woorden getoond; daarna volgen woordvergelijking, luisteren waar audio bestaat en woordbouw. Afleiders zijn reeds getoonde woorden uit dezelfde leesstap; gelijke schrijfwijzen met verschillende betekenissen worden niet tegenover elkaar gezet. De eerste zeer kleine routes blijven bewust korter dan acht opdrachten, zodat er geen extra woorden of opdrachten worden toegevoegd alleen om een aantal te halen.

Andere oefenvormen zijn in de bestaande oefenbank te openen. Alle achttien renderers blijven in de code beschikbaar; niet alle achttien zijn al aan nieuwe inhoud gekoppeld. Oude teksten, gesprekken, zinsopdrachten en contextscènes zijn bewaard in de bestaande broncatalogus, maar worden niet zonder inhoudelijke herindeling als nieuwe Taalroute-leerstof aangeboden. Lege tabs voor teksten en gesprekken worden niet aan de cursist getoond.

De bestaande bediening blijft behouden. Wel hersteld: een begeleide route kan echt worden afgerond; Verder blijft na een fout geblokkeerd. Bij woordbouw tellen gelijk gespelde herhaalde tegels als hetzelfde antwoord, ongeacht hun interne ID. Bewaarde woorden gebruiken nu de betekenis-ID en verschijnen ook bij Herhalen. Oude voortgang wordt niet gemigreerd of verwijderd. Een handmatig gekozen herhaalroute veronderstelt dat de docent/cursist de woorden al heeft aangeboden; de app bewijst die voorwaarde niet.

## Media en vrijgave

De 331 woordopnamen en 43 beeldkoppelingen uit de vorige werkversie zijn behouden. Op 16 oktober zijn 108 bestaande woordbeelden teruggevonden via de exacte mediacatalogus en de fotoherstelindex: samen 151 beelden. De archiefbestanden zijn op SHA-256 gecontroleerd en beeldverhoudingen blijven behouden bij de webconversie. Er zijn geen nieuwe beelden of opnamen gegenereerd. De oorspronkelijke bestanden en herstelgegevens staan in de bestaande Drive-back-ups; de nieuwe koppelingsevidentie wordt apart geback-upt en niet in de publieke app opgenomen.

Zeven betekenissen missen audio: fit, koekje, pak (verpakking), sap, spuit, tomaat en zeef. Voor de zes nieuwe schrijfwijzen is geen exacte opname in de gecontroleerde aflever-CSV gevonden; een opname van bijvoorbeeld tomaten is geen opname van tomaat. Er ontbreken 187 beeldkoppelingen. De gecontroleerde broncatalogus levert daarvoor geen eenduidige teruggevonden foto; dit bewijst niet dat nergens anders beeldmateriaal bestaat. Bij ontbrekende audio wordt geen luisterkeuze aangemaakt. De verpakkingsbetekenis van pak krijgt geen kledingbeeld of -opname. De afgekeurde losse t blijft ongebruikt. Uitspraakcontrole, beeldcontrole en complete instructie-audio staan open; technische tests vervangen die beoordeling niet. De oefenproductieskill laat deze onvolledige reeks niet als publiceerbaar bestempelen.

Het hoofdmenu blijft Verder, Lessen, Woorden en Herhalen. Nieuwe leesstappen vervangen alleen de CP-indeling binnen de bestaande schermen; geen nieuw hoofdmenu of nieuw uiterlijk. De tijdelijke lokale controleversie op poort 18816 is op 16 oktober volledig door de bestaande browsertest gekomen. Deze lokale versie is geen publicatie op het openbare domein. Ook de openbare startpagina, toegang met de bestaande democode en CP-home zijn in de browser gecontroleerd; er waren geen JavaScript-fouten.

De enige productiebranch blijft 26buckets/taalroute-klink:main. De werkbranch is codex/klink-taalroute-20261016, afgeleid van c221eb104fe64a17de9e51a59ddc5667ea805518. De live-Worker-versie efddd274-4f66-4d5b-9bfb-c21e87acc89d is opnieuw rechtstreeks in Cloudflare gecontroleerd. De browser-appcode is gelijk na scopebewuste normalisatie van minifiernamen; 41 gedownloade servermodules komen bytegelijk overeen met de opgebouwde basis, inclusief de server-gerenderde app en beide API-routebundels. Zeventien runtime-/manifestmodules verschillen nog. Een ontbrekende broncommit-tag is dus niet vervangen door een aanname: de volledige live-bronkoppeling blijft een open publicatievoorwaarde. Geen publicatie of wijziging aan de openbare app uitgevoerd.

## Lokale controles

De vervolgcontrole staat in UI-REVIEW-20261016.md. De app verstuurt geen antwoorden meer naar de gedeelde demo-opslag. De twee oude demo-eindpunten antwoorden met 410, zonder bestaande opgeslagen gegevens te verwijderen. Bewaarde woorden blijven lokaal op het apparaat beschikbaar; de oefencode is geen persoonlijke beveiligde accounttoegang.

- npm run test:curriculum: 14 controles van de bevroren gegevens, routes, bestaande spelercontracten, afleiders, plaatsing, betekenisonderscheid en mediapaden.
- npm run test:curriculum:browser: alle onderdelen in de bestaande lessenpagina, een volledige begeleide route met luisteren en foutherstel, alle negen gekoppelde families, woorden bewaren/herhalen, docenttotalen en desktop/tablet/telefoon.
- TypeScript, gerichte React/lintcontrole en productiebuild. Geen zware cloudcontroles; geen GitHub Actions-workflows toegevoegd.
- scripts/check-klink-media-files.mjs controleert alle gekoppelde bestanden en ingebedde Taalroute-metadata; scripts/verify-klink-baseline.mjs legt de begrensde livevergelijking vast zonder volledige herkomst te claimen.
- Bron en nieuw testbewijs worden in de bestaande Alfabeta+ Klink-projectmap geback-upt. De eerdere oorspronkelijke audio en herstelgegevens blijven behouden.
