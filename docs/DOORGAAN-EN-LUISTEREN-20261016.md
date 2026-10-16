# Doorgaande bediening en aangesloten taal

De bestaande Klink-app, vormgeving, betekenis-ID’s en Lexicon-indeling blijven behouden. Dit is een vervolg op de lesroute-uitbreiding van dezelfde dag; de eerdere notitie beschrijft de toestand vóór deze wijziging.

## Bediening

- In begeleide lessen start het noodzakelijke woord- of zinsgeluid vanzelf. Een losse luisterklik is niet meer verplicht. Als de browser automatisch afspelen weigert of het bestand faalt, blijft een luisteropdracht geblokkeerd en is opnieuw luisteren mogelijk.
- Visuele opdrachten hebben geen luistervoorwaarde. Een modelkaart vraagt geen extra luisterklik om verder te mogen. De grote foto/woordknop herhaalt de opname; de dubbele losse luisterknop is verwijderd.
- Goede beoordeelde antwoorden gaan na 650 ms verder. De eigen knop Verder gaat altijd verder, ook tijdens feedback. Automatisch doorgaan heeft een afzonderlijke pauzeknop. Modellen en situaties blijven op eigen tempo; fouten gaan nooit vanzelf door.
- Afspelen is één herbruikbare speler. Werkelijke audio-eindes, afspeelfouten, afgebroken opdrachten, snelle herhaalklikken en navigatie worden afgehandeld. Een oude afspeelbelofte mag een nieuwe opdracht niet ontgrendelen.
- Opdrachten zijn opnieuw hoorbaar via hun kop. Iedere instructie wordt eenmaal volledig aangeboden in de huidige cursistsessie. Deze herinnering staat alleen in sessionStorage en wordt bij Afsluiten gewist. Opslagweigering blokkeert oefenen niet.

## Inhoud en media

Acht bestaande eigen Taalroute-zinnen en vier situaties hebben exact hun bestaande volledige opnamen behouden. Er zijn geen woordopnamen tot zinnen aan elkaar geplakt. De plaatsing is op doelbetekenis, in Gebruiken en in de bestaande oefen- en tekstonderdelen. Een passende inhoud is niet bij willekeurige andere woorden herhaald om dekking te suggereren. De route blijft maximaal zestien opdrachten; niet iedere beschikbare variant is verplicht.

Deze inhoud is luisteren met tekststeun. De docent bereidt de betekenis mondeling voor. Bekende doelwoorden komen terug in rijkere taal; overige zinswoorden hoeven nog niet zelfstandig gelezen te worden. Geen zelfrapportage wordt als zelfstandig lezen of tekstbegrip gescoord. Foto’s geven soms de beginsituatie weer, niet de volledige handeling. De vier gekoppelde situatiebeelden zijn visueel bekeken; dit vervangt de menselijke betekenisbeoordeling niet.

Nieuwe instructies: zeventien korte opnamen, 852 scripttekens. Steunstem Roland, voice-ID h6uBOiAjLKklte8hdYio; doeltaalmodel Remko, voice-ID 0qLmDzgqulxcvv0yf3kg. De stemmen en rollen zijn vóór productie vastgelegd. De oude opnamen zijn niet klakkeloos gebruikt: zij hadden dezelfde stem als de doeltaal, en sommige scripts vroegen om een inmiddels verwijderde controleklik. De nieuwe instructies noemen Controleer alleen bij typen/dictee, waar die knop functioneel blijft.

De zeven eerder geproduceerde woordkandidaten zijn nu in deze werkversie gekoppeld: fit, koekje, pak (verpakking), sap, spuit, tomaat en zeef. Bestaande goede woordaudio is niet opnieuw gegenereerd. De losse t blijft geparkeerd.

Er zijn nu 338 gekoppelde woordopnamen, waarvan zeven nieuwe beoordelingskandidaten; 161 woordbeelden; twaalf contextopnamen en zeventien instructieopnamen. Er ontbreken nog 177 betekenisbeelden. Een beginletter of afbeelding van een andere betekenis geldt niet als vervangend betekenisbeeld.

Alle 24 nieuwe koppelingen zijn technisch gecontroleerd. De zeventien instructies zijn in de bestaande productiedienst gemaakt binnen gecontroleerd beschikbaar tegoed, zonder onzekere betaalde herhaalpogingen. De WAV-geluidsdata zijn bij merkmetadataherstel bytegelijk gebleven. Artiest en passend album vermelden Taalroute; ondersteunde merkvelden van de bestaande MP3-contextopnamen zijn gecontroleerd. Geen generatorvermeldingen in aflevermetadata. Originele audiobestanden en productie-/hashbewijzen blijven apart in de herstelset.

## Controle en vrijgave

- Volledige bestaande lokale browserreeksen, 24 curriculum-/audio-contracttests, vier publicatiebewijstests en een nieuwe reeks met echte audio.
- De nieuwe browsercontrole dekt automatische geluidsstart, 650 ms feedback, directe Verder, pauze, fout herstellen, tekst/foto als herhaalvlak en desktop/tablet/390/320 px.
- De Word- en contextkoppelingen worden op bestanden, Taalroute-metadata en exacte tekst/opnamecombinatie gecontroleerd. Technische decodeerbaarheid is geen uitspraakbeoordeling.
- TypeScript, gerichte lintcontrole en productiebuild zijn geslaagd. De volledige lokale reviewreeks is ook tegen de gebouwde Worker-versie geslaagd. Alle 24 nieuwe audioleveringen zijn daar opgehaald en bytegelijk bevonden aan de gecontroleerde bestanden. De brede repository-lint bevat nog eerdere, niet-gerelateerde fouten. Geen fysieke telefoon-, volledige screenreader- of cursistenbeoordeling geclaimd.
- De actuele Cloudflare-publicatie is opnieuw gelezen: efddd274-4f66-4d5b-9bfb-c21e87acc89d, gepubliceerd op 14 oktober 2026, met bewezen bron c221eb104fe64a17de9e51a59ddc5667ea805518. Deze wijziging is daarvan een afstammeling.

Publicatie is niet uitgevoerd. De vrijgavecontrole blijft blokkeren op ontbrekende beelden en inhoudelijke uitspraak-, beeld- en contextvrijgave. Kandidaatopnamen hebben geen gefingeerde goedkeuring gekregen. De normale publicatieroute en canonieke main zijn niet omzeild. De cursistpilot blijft conform Nico’s besluit niet verplicht. Een GitHub-push of Drive-back-up is geen livepublicatie.

## Kritische tegencontrole

Minder klikken mag niet betekenen dat een geluidsfout als gehoord telt. Automatisch verder mag een fout niet overslaan en mag de Verder-knop niet van betekenis laten wisselen. Een afgeronde luistertekst is geen bewijs van zelfstandig lezen. Een technisch werkende audiokoppeling bewijst de uitspraak niet. Aan alle vier deze grenzen zijn regressiecontroles of expliciete vrijgaveblokkades gekoppeld.

Bewijs en herstel: outputs/continuous-flow-20261016, outputs/media-connection/media-check.json en de volledige werkversie in de bestaande Drive-projectmap. Geen Drive-links of interne productiestatus op cursistschermen.
