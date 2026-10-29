# Leesbare modelzinnen en consistente docentkaarten

Nico vraagt een zichtbare kop boven de vijf docentopdrachtkaarten en consistente labels, en vraagt de zinweergave overal te herstellen en online te zetten. Basis: main 84fc898006a9b668a2630838ac9e8c407c063620, na livebron 4970049f7831d020f52218e39c192368bb371f23.

Alle modelkaarten met meerdere woorden gebruiken nu 24–36 px en regelhoogte 1,4. Het bestaande oefenvlak kan meegroeien; geen tekstverlies onder zijn rand. Losse woorden houden hun bestaande formaat. Dit zit in de gedeelde renderer, zonder een aparte Alfa C-speler of inhoudelijke wijziging. Alle tien opdrachten uit beide huidige productie-Kijk-en-luisterreeksen zijn in Chromium en WebKit op vier schermmaten gecontroleerd (80 gevallen). Alle tekstregels passen binnen het oefenvlak zonder interne of horizontale overloop. De audioaanroepen blijven gekoppeld aan dezelfde bestanden. Bestaande woordkaarten blijven 44 px.

De vijf bestaande docentgroepen staan in dezelfde hoofdkaart onder de zichtbare kop 'Opdrachten met je docent'. Dezelfde knoppen, randen, iconen en rasterindeling blijven staan. Titel en aantal staan apart; een enkel item heet '1 opdracht'. Alle vijf links en browserterugwegen slagen in acht schermgevallen. Desktop en mobiel visueel bekeken.

Verder lokaal: typen, gerichte lint, productiebuild, route- en voortgangseenheidstests, 96 menugevallen over alle zes niveaus met 180 oude blokopeningen/terugwegen, en 50 integratiegevallen voor toetsenbord, voortgang en docentroute. De oude integratietest is gericht bijgewerkt: twee reeds gepubliceerde gewone Alfa C-categorieën blijven aanwezig en het zichtbare nieuwe kopje benoemt de docentsectie. Inhoud, antwoorden, audio, afbeeldingen en opslagmodellen blijven bytegelijk.

Geen fysieke apparaatproef of cursistenproef geclaimd. De opgegeven externe stijlreferentiemap ontbreekt lokaal; de bestaande applettersoort, gewichten, knoppen en compositie blijven behouden. Deze UI-correctie genereert geen beelden of audio. De eerdere tekstproef onder docs/look-listen-text-20261029 is historische voorcontrole; het huidige register en onlinebewijs bepalen de publicatiestatus.
