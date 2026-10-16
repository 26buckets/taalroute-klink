# Klink — Taalroute-indeling

De app gebruikt de vastgezette Lexicon-editie `klink-leerlijn-20261016-v1` uit `data/klink-curriculum.json`. Geen live afhankelijkheid van Drive of het wachtwoordbeveiligde Lexicon. Alle 337 woordvormen / 338 betekenissen zijn opgenomen.

## Ingebouwd

- 10 bouwgroepen, 37 basisleesstappen en 3 herhaalmomenten.
- 23 gekozen uitbreidingssets; de andere woorden blijven bereikbaar in de woordenbank.
- Alle 78 langere woorden behouden hun vijf leesroutes. De vijfde route houdt drie onderdelen. Klankvoorwaarden worden niet verward met het eerste leesmoment.
- Bekende, nieuwe en terugkerende woorden blijven gescheiden. Herhaalactiviteiten nemen alleen al geïntroduceerde woorden mee.
- Vier gekoppelde oefenvormen: woordmodel (KL-01), hetzelfde woord zoeken (WO-02), gehoord woord kiezen (KL-03) en woordbouw met voorbeeld (WO-03). Een zichtbare schrijfvorm vergelijken/bouwen bewijst geen zelfstandig lezen.
- Geen overname van de oude pakketgrenzen, teksten, gesprekken of alle 18 technische oefenfamilies in de nieuwe leerlijn. De bestaande code en inhoud blijven behouden; de nieuwe route is inhoudelijk opnieuw gekoppeld.
- Directe antwoordfeedback, stabiele antwoordposities na een fout, tik- en toetsenbordbediening, automatisch verder met handmatige optie, terugstap en herstel bij woordbouw.
- Een afzonderlijke lokale sleutel voor nieuwe voortgang; oude sleutels worden niet gewist of gemigreerd. Geen nieuwe persoonsgegevens of serveropslag.

## Media en open werk

331 betekenissen hebben gekoppelde woordaudio. De afgeleverde bestanden zijn verliesloos voorzien van Taalroute-merkvelden; gedecodeerde geluidsdata zijn vóór en na gelijk. De technische controles en oorspronkelijke bestanden zitten in het aparte herstelarchief, niet in de cursistinterface.

Zeven betekenissen missen audio: fit, koekje, pak (verpakking), sap, spuit, tomaat en zeef. De verpakkingsbetekenis van pak krijgt nooit automatisch de kledingafbeelding. Bij ontbreken van audio is geen luisterkeuze actief; de begeleide woordvormactiviteiten blijven beschikbaar als 'Lees samen'.

43 beelden zijn gekoppeld; 295 betekeniskaarten hebben nog geen beeldbinding. Geen onjuiste vervangingsplaatjes. Voor sommige abstracte woorden is een andere beeldfunctie nodig dan een losse objectfoto. De geïmporteerde opnamen hebben geen nieuw geclaimde menselijke uitspraakgoedkeuring. Instructie-audio voor de volledige nieuwe route is nog niet compleet. De afgekeurde losse t wordt nergens gebruikt. Geen nieuwe audio of beelden gegenereerd.

De bronpakketten melden zelf nog open menselijke mediareview. Een nieuwe cursistpilot is op verzoek geen verplichte vrijgavepoort; hij is niet uitgevoerd. De oefenproductieskill verhindert dat onvolledige media als vrijgegeven oefenreeks worden gepubliceerd.

## Publicatiebasis

De enige productiebranch blijft `26buckets/taalroute-klink:main`. De werkbasis is commit `c221eb104fe64a17de9e51a59ddc5667ea805518`, rechtstreeks opgehaald van GitHub. De huidige Cloudflare Worker-versie is `efddd274-4f66-4d5b-9bfb-c21e87acc89d` (14 oktober 2026, 19:44 UTC). De versie bevat geen broncommit-tag; overeenkomst van datum is geen sluitend bronbewijs. Daarom staat `commitToLiveVersionProven` nog op false. Geen publicatie uitgevoerd.

Publiceren gaat pas na afgeronde controles via `npm run deploy`. De controle blokkeert op ontbrekende inhoudelijke vrijgave, ontbrekende audio, onvolledige instructies, onbewezen live-bronkoppeling of een andere branch dan main. Niet rechtstreeks met een alternatieve configuratie publiceren.

De oude werkmap bevat iCloud-verwijzingen die niet betrouwbaar leesbaar zijn. Die bestanden zijn niet vervangen of gewist. Deze ombouw is uitgevoerd in een verse GitHub-kopie; ongerelateerde lokale wijzigingen zijn niet meegenomen.

## Lokale controle

- `npm run test:curriculum`: volledige dekking, alle stappen en woordactiviteiten, betekenisonderscheid, leesroutes, herhaalfilter, opslagvalidatie en mediapaden.
- `npm run test:curriculum:browser`: alle 40 basisonderdelen, 23 uitbreidingssets, zoekfuncties, vijfde leesroute, fouten en herstel, luisteren, afronden, herhaling en uitlevering van alle media.
- De browserreeks omvat 13 controles, inclusief automatisch doorgaan, een bewust onderbroken audiolading met herstel, en foutief gelegde letters met terugnemen en opnieuw beginnen. De 8 gegevens-/logictests slagen eveneens.
- Desktop 1366×768, tablet 768×1024, telefoon 390×844 en 320×740.
- TypeScript, gerichte React/lintcontrole, bestaande cataloguscontrole en productiebuild.
- Geen GitHub Actions-workflow toegevoegd of uitgevoerd. Reële uitspraak en herkenbaarheid van alle beelden zijn hiermee niet bewezen.

## Bewaarplaats van deze ombouw

Werkbranch: `codex/klink-taalroute-20261016`. Deze branch is geen productiebranch; main blijft ongewijzigd totdat de vrijgavevoorwaarden zijn vervuld. De bron en herstelgegevens worden ook in de bestaande Alfabeta+ Klink-projectmap opgeslagen. Een back-up is geen publicatie.
