# Klink — uitbreiding op de bestaande woordgroepen

## Actuele bouwstand

Dit verslag vervangt de implementatiestatus van de eerdere menu-inventaris, niet de waargenomen DigLin-menugegevens. Referentie is de eigen inventaris van alle zestien ABC-menu’s en twaalf hoofdonderdelen. Er is geen externe code, inhoud, afbeelding, opname of vormgeving overgenomen. H5P-extra’s zijn nog niet aan de beurt.

De uitbreiding werkt in de bestaande lokale Klink-app. Geen nieuw product, geen herindeling van Lexicon, geen publicatie. Alle vijftien onderdelen, 302 lesroutes en bestaande betekenis-ID’s blijven behouden. Een nieuw geopend onderdeel begint bij de hele woordgroep. Een expliciet hervatte les blijft naar haar bestaande positie gaan.

## Cursist: één woordgroep, verschillende handelingen

Van **Alle woorden → Samen oefenen** naar zes rustige rubrieken. Geen technische oefenfamilie- of aantallendropdown als verplichte ingang.

| Rubriek | Aangesloten mogelijkheden |
| --- | --- |
| Ontdekken | Foto, geschreven woord en bestaande hele woordopname |
| Kiezen | Hetzelfde woord, horen/kiezen, lezen/foto, woord/foto koppelen, geluid/woord koppelen |
| Maken | Woordbouw met en zonder model; slepen, aantikken en toetsenbord; werkbladen met meerdere woorden, met en zonder model; ontbrekende leeseenheid |
| Schrijven en spreken | Natypen, woorddictee, papiermodel, lettermodel, papierdictee, nazeggen/opnemen |
| Samen herhalen | Woordbingo, fotobingo, memory, woordkaarten en leesreeks |
| Zinnen en verhalen | Bestaande zinnen meelezen, woord→zin, zoek de zin, zinsdictee, zinnen nazeggen, bestaande begripsvragen, teksten en gesprekken |

Er zijn 31 configureerbare oefenkeuzes; het eerste onderdeel heeft ze alle 31. Andere onderdelen tonen alleen passende keuzes: doorgaans 30 of 31, het voorbereidende onderdeel 25. Dit zijn géén 31 nieuwe leerdoelen of onafhankelijke lessen. Dezelfde woorden en zinnen komen doelgericht terug in verschillende handelingen. De generator en vergelijkingsexport berekenen aantallen per onderdeel.

Eerste woordgroep ongewijzigd: **mat, tas, map, man, pan, jas**. Voor de meeste woordreeksen zes doelbeurten; koppelen en memory werken met drie paren per bord. Bingo heeft drie vakken per kaart en komt langs alle zes woorden, niet slechts langs een winnende rij. Grote groepen worden in dezelfde kleine borden verdeeld, zonder geschikte woorden weg te laten. Woordbingo en geluid-woordkoppeling vereisen geen foto; fotobingo wel.

Werkbladen tonen maximaal vier woorden tegelijk, daarna de overige woorden. De positie wordt per blad bewaard; losse tegelposities en afgeronde rijen binnen het blad worden bij heropenen opnieuw aangeboden. Dit is geen nauwkeuriger hervatgarantie dan de implementatie biedt. De bestaande lesvoortgang wordt niet gewijzigd.

## Bediening en beoordeling

- Reeksen houden de bestaande speler, feedback, audioherhaling en automatische volgende stap. Audioafhankelijke antwoorden zijn vergrendeld tot het echte geluid is afgespeeld. Geluidstoringen bieden opnieuw proberen.
- Op een werkblad kiest de cursist zelf de woordopname, zodat meerdere rijen niet tegelijk gaan spreken. Iedere luisterrij ontgrendelt afzonderlijk. Met model is lezen/nabouwen ook zonder afspelen mogelijk.
- Slepen en tikken veranderen dezelfde tegeltoestand. Een doelvak kan vooraf worden gekozen; tikken op een gevuld vak haalt de letter weg. Herhaalde letters hebben afzonderlijke tegel-ID’s. Bestaande combinaties zoals `oe` blijven intact.
- Bij fouten blijven keuzeplaatsen, kaarten en correcte paren staan. Voortgang van groepsreeksen heeft een eigen opslagnaamruimte en is geen lesvoltooiing.
- Leesreeks en papierdictee beginnen op eigen tempo. Zes/negen seconden is vrijwillig, zonder snelheidsscore. De timer wacht tijdens audio en loopt niet door in een verborgen tab.
- Papierwerk, lettermodellen, luisteren/meelezen en opnamebevestiging blijven **deelname**. Geen automatische beoordeling van handschrift, uitspraak of leesbegrip.
- Zoek de zin gebruikt bestaande zinnen met hetzelfde frame en één ander woord. De volledige voorwaarden van alle antwoordzinnen blijven bewaard. Dit is gehoorde-zinherkenning, geen onafhankelijke begripsopdracht.

## Brede hoofdonderwerpen

In **Docent → Oefenkaart → Volledige inhoudslijn** staan veertien eigen onderwerpen: Leesstart; Verder met lezen; Op papier en toetsenbord; Lezen voor informatie; Klank voor klank; Luister en begrijp; Zeg het zelf; Taal in je dag; Woorden verbinden; Zo schrijf je het; Zo maak je een zin; Een bericht of formulier; Nog een keer, anders; Rustig beginnen.

Doel, huidige aansluiting en ontbrekend werk staan naast elkaar. Lege onderwerpen krijgen geen misleidende cursistknop. Deze structuur biedt ruimte voor de gevraagde breedte, maar is **geen claim dat het volledige DigLin-minimum al inhoudelijk gerealiseerd is**. Nog open: losse klankmodellen/contrasten/synthese, echte schrijftrajecten, ruimere tekstbegripsopdrachten, rolproductie, themaroutes, functioneel schrijven, spellingregels en grammatica. Geschreven lettermodellen lossen dat niet op. De afgekeurde gesproken t blijft geparkeerd.

## Audio en vrijgave

Negen nieuwe instructieteksten hebben vaste ID’s in `groupInstructionNeeds`. Docent → Media toont die in de bestaande matrix. Bestaande woord-, zin-, tekst- en gespreksopnamen zijn hergebruikt, niet opnieuw gemaakt. De matrix omvat nu 2.402 actieve/voorbereidende ID’s: 2.354 bestanden, 47 ontbrekend (38 bestaande voorbereidingen plus negen nieuwe instructies), één geparkeerde t. De veel grotere bronvoorraad blijft apart en ongeplaatst.

Een latere koppeling controleert exacte tekst, stemrol, voice-ID, inhoudelijk akkoord en metadatavrijgave. Bestaande bestanden worden niet stilzwijgend vervangen. Geen afspeelknop naar een niet-bestaande opname. Deze wijziging publiceert geen audio en omzeilt geen metadatapoort.

`data/klink-group-practice-release.json` bewaakt de nieuwe combinatie- en instructievrijgave. De publicatiecontrole leest dit record én controleert de geregistreerde instructiebestanden. De eerdere mixvrijgave en canonieke publicatiebasis blijven gelden.

## Verificatie en herstel

Tests: `test-group-practice.mjs` (alle onderdelen, doelgroepdekking, deterministische volgorde, bronzinnen, voorwaarden, audio, deelname en hervatten), `test-group-practice-browser.mjs` (bediening, audiofout, bingo, werkbladen, toetsenbord, bestemmingskeuze, papierdictee, optioneel tempo en schermbreedtes). Bestaande browsercontroles zijn aangepast aan de nieuwe, expliciet gevraagde ingang, met behoud van les- en lifecyclecontroles.

React-controle: gegevens blijven buiten renderers; effectopruiming voor audio, timers en late microfoontoestemming; geen netwerkopslag van cursisten; ontbrekende data niet als succes behandelen. De bestaande grote applicatiebundel blijft een aandachtspunt. Geen nieuwe afhankelijkheden of cloudworkflows.

De actuele DigiBord-stijlreferentiemap was niet beschikbaar. De bestaande Klink-typografie, iconen, knopstijl en compositie zijn behouden; geen veronderstelde nieuwe stijlsheet toegepast.

Ontwerpbasis: deze oefenvormen verwijzen naar de bestaande woord-/les-ID’s en boekdoelen. Werkelijk ingeroosterde docentbijeenkomsten, tijdtoedeling en eigen lesobservatiepunten zijn met deze technische aansluiting niet afgerond. Geen cursistproef of volledige screenreader-/didactische validatie geclaimd.

Herstel: bron en controles worden gebundeld in de bestaande Drive-projectmap Alfabeta+ Klink. Ongewijzigde media staan in de eerdere herstelpakketten; deze uitbreiding heeft geen nieuwe mediabestanden. Een herstelkopie is geen livepublicatie.

### Uitkomst lokale eindreview

- 48 bestaande curriculumtests, zes audioregistertests en zes nieuwe groepscontracttests geslaagd.
- Twaalf nieuwe browsercontroles geslaagd, waaronder alle vijftien onderdelen, slepen/toetsenbord/tikbestemming, twee werkbladen, volledige bingodekking, foutaudio, zinsherkenning, papiermodel en vrijwillig tempo dat in een verborgen tab stopt.
- De bestaande controles voor lesintegratie, lifecycle/microfoonopruiming, uitbreiding, doorlopen, acht begripsvragen, verbonden teksten/gesprekken, cursistentaal, UI, echte audio, kaarten, startpagina, groepsmix en audiomatrix zijn na aanpassing aan de nieuwe ingang afzonderlijk geslaagd. De eerste gecombineerde run stopte op verouderde selectors; die zijn hersteld en de betreffende controles opnieuw uitgevoerd.
- De UI-controle vond een werkelijk ingeklapte draaikaart door een hoogtecontainer in de nieuwe reeks. De kaart houdt nu weer haar vaste vierkante formaat; hercontrole op zeven schermformaten geslaagd. Het openen van een andere oefenvorm zet ook het daadwerkelijke app-scrollpaneel terug naar het begin.
- TypeScript, gerichte lintcontrole, diffcontrole en productiebuild geslaagd. Bestaande waarschuwingen over bundelgrootte en builddeprecatie blijven open. Geen zware GitHub Actions, push of publicatie uitgevoerd.
- Menselijke beoordeling van nieuwe combinaties/instructies, uitvoering in een echte bijeenkomst en toetsing met cursisten blijven afzonderlijke open punten. De oefenproductieskill voorkomt dat technisch aangesloten onderdelen als complete of vrijgegeven methode worden gepresenteerd.
