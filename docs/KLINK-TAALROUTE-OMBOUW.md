# Klink — nieuwe leesstappen in de bestaande app

## Correctie van de eerdere ombouw

De bestaande LearnerApp, TeacherApp, PackagePlayer en PackageExerciseBrowser zijn opnieuw de actieve app. De aparte CurriculumApp en de bijbehorende stylesheet zijn verwijderd; de eerdere werkversie is herstelbaar via commit 2721eff. De oorspronkelijke startpagina, navigatie, lespagina, oefenwerkruimte, woordkaarten en docentomgeving blijven het uitgangspunt. De enige wijzigingen aan de bestaande globale stylesheet zijn twee mobiele kolomlabels: Bouwgroepen en Leesroutes in plaats van de oude pakketnamen.

## Eén inhoudelijke basis

De vastgezette Lexicon-editie klink-leerlijn-20261016-v1 blijft ongewijzigd. lib/taalroute-packages.ts zet die gegevens om naar het bestaande les- en oefencontract. Er is geen live afhankelijkheid van Drive of Lexicon.

- 337 woordvormen / 338 betekenissen; iedere betekenis heeft één eerste vindplaats in de woordenbank.
- 10 bouwgroepen met 37 basisleesstappen en 3 herhaalmomenten.
- 23 uitbreidingssets en 154 overige oefenwoorden.
- 78 langere woorden in vijf afzonderlijke leesroutes; 7 steunbetekenissen onder voorbereiding.
- Bekende, nieuwe en terugkerende woorden blijven ongewijzigd uit Lexicon overgenomen.

Er zijn 302 te openen routes: 40 basisonderdelen, 23 uitbreidingssets en 239 individuele woordroutes. Dit zijn niet 302 nieuwe didactische lijsten. De technische containers zijn de tien bouwgroepen, vijf leesroutes en één ondersteunend onderdeel; zij zijn niet afgeleid van de oude zestien pakketgrenzen.

## Bestaande oefenspelers

De koppeling levert 3.895 oefeninstanties in negen bestaande families: modelkaart, woord/beeld kiezen, koppelen, woordbouw, typen, nazeggen, schrijven, memory en woordkaarten. Dezelfde woordbetekenis kan in verschillende leesstappen terugkomen. Dit aantal is geen aantal unieke oefenvormen of bewezen beheerste doelen.

Iedere begeleide route gebruikt expliciete oefen-ID's. De oude zoekmatch op losse woorden en de beperking tot één opdracht per familie bepalen de nieuwe route niet meer. Eerst worden de woorden getoond; daarna volgen woordvergelijking, luisteren waar audio bestaat en woordbouw. Afleiders zijn reeds getoonde woorden uit dezelfde leesstap; gelijke schrijfwijzen met verschillende betekenissen worden niet tegenover elkaar gezet. De eerste zeer kleine routes blijven bewust korter dan acht opdrachten, zodat er geen extra woorden of opdrachten worden toegevoegd alleen om een aantal te halen.

Andere oefenvormen zijn in de bestaande oefenbank te openen. Alle achttien renderers blijven in de code beschikbaar; niet alle achttien zijn al aan nieuwe inhoud gekoppeld. Oude teksten, gesprekken, zinsopdrachten en contextscènes zijn bewaard in de bestaande broncatalogus, maar worden niet zonder inhoudelijke herindeling als nieuwe Taalroute-leerstof aangeboden. De tabs daarvoor blijven bestaan en tonen de actuele nulstand.

De bestaande bediening blijft behouden. Wel hersteld: een begeleide route kan echt worden afgerond; Verder blijft na een fout geblokkeerd. Bij woordbouw tellen gelijk gespelde herhaalde tegels als hetzelfde antwoord, ongeacht hun interne ID. Bewaarde woorden gebruiken nu de betekenis-ID en verschijnen ook bij Herhalen. Oude voortgang wordt niet gemigreerd of verwijderd. Een handmatig gekozen herhaalroute veronderstelt dat de docent/cursist de woorden al heeft aangeboden; de app bewijst die voorwaarde niet.

## Media en vrijgave

De 331 woordopnamen en 43 beeldkoppelingen uit de vorige werkversie zijn behouden. Geen nieuwe media geproduceerd of veranderd. De bestaande audiometadatacontrole en gelijke gedecodeerde geluidsdata staan in het eerdere herstelarchief.

Zeven betekenissen missen audio: fit, koekje, pak (verpakking), sap, spuit, tomaat en zeef. Er ontbreken 295 beeldkoppelingen. Bij ontbrekende audio wordt geen luisterkeuze aangemaakt. De verpakkingsbetekenis van pak krijgt geen kledingbeeld of -opname. De afgekeurde losse t blijft ongebruikt. Uitspraakcontrole, beeldcontrole en complete instructie-audio staan open; technische tests vervangen die beoordeling niet. De oefenproductieskill laat deze onvolledige reeks niet als publiceerbaar bestempelen.

De enige productiebranch blijft 26buckets/taalroute-klink:main. De werkbranch is codex/klink-taalroute-20261016, afgeleid van c221eb104fe64a17de9e51a59ddc5667ea805518. De bekende live-Worker-versie is efddd274-4f66-4d5b-9bfb-c21e87acc89d. Een ontbrekende broncommit-tag is niet vervangen door een aanname: de live-bronkoppeling blijft een open publicatievoorwaarde. Geen publicatie of wijziging aan de openbare app uitgevoerd.

## Lokale controles

- npm run test:curriculum: 14 controles van de bevroren gegevens, routes, bestaande spelercontracten, afleiders, plaatsing, betekenisonderscheid en mediapaden.
- npm run test:curriculum:browser: alle onderdelen in de bestaande lessenpagina, een volledige begeleide route met luisteren en foutherstel, alle negen gekoppelde families, woorden bewaren/herhalen, docenttotalen en desktop/tablet/telefoon.
- TypeScript, gerichte React/lintcontrole en productiebuild. Geen zware cloudcontroles; geen GitHub Actions-workflows toegevoegd.
- Bron en nieuw testbewijs worden in de bestaande Alfabeta+ Klink-projectmap geback-upt. De eerdere oorspronkelijke audio en herstelgegevens blijven behouden.
