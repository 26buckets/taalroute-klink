# Goedgekeurde openingsloader — 1 november 2026

Nico: “Ja, deze is goed. Zet deze loader nu in Klink op de plek van ‘Klink wordt geopend…’. Houd de rest van de vormgeving en alle bestaande functies hetzelfde.”

Livebasis e6fc6294fb4670b0624c5e8c909018fe52ad5804; main a160cd5816dd92e70feb6729e18dc74fe44d66a8 bevat daarna uitsluitend de bestaande controle- en back-updocumentatie. Dit is een gerichte toevoeging aan de vaste vormgeving, geen nieuw appontwerp.

De drie bestaande openingsmeldingen gebruiken één kleine component met exact de goedgekeurde v4 SVG-bestanden. In deze SVG’s zijn de oorspronkelijke logo-contouren als transparante PNG-lagen behouden. Kleuren #0E3B44 en #3C8962 en de animatie zijn ongewijzigd; de overige officiële app-logo’s blijven staan. De huidige pagina bepaalt de achtergrond.

Geen zichtbare laadtekst, bediening, voortgang of herhaling. De tekst blijft beschikbaar voor schermlezers. De animatie duurt hoogstens zolang echt geladen wordt: geen extra timer of verplichte animatieduur. Een langzame verbinding toont na de eenmalige beweging het complete logo. Een picture-source kiest het stilstaande logo bij prefers-reduced-motion, ook bij een gewijzigde systeemvoorkeur. Routing, Suspense, privacy en het bestaande moduleherstel blijven exact gelijk.

Lokaal gecontroleerd: 32 trage laadscenario’s en de initiële serverweergave in Chromium/WebKit, desktop/mobiel, licht/donker en minder beweging; 24 bestaande schermen vóór/na (17 pixelgelijk; overige verschillen maximaal 0,027% van de kleurkanalen, onder de grens 0,1%); 12 toetsen/touch/antwoord/voortgang/uitleg-controles; 8 docent-randgevallen en 10 hersteltests. Typecontrole, gerichte lint en productiebuild geslaagd. Bestaande bronbestanden, inhoud, audio, opslag en afhankelijkheden buiten de expliciete loaderwijziging worden door de publicatiecontrole beschermd.

Geen fysieke telefoon, echte camera of menselijke schermlezertest uitgevoerd; de camera-randtest gebruikt een synthetische stream. Geen GitHub Actions-workflows aanwezig of toegevoegd; controles zijn lokaal uitgevoerd.

Herstel: gebruik de vastgelegde baseline plus de gewijzigde bestanden uit het Drive-pakket; het zelfstandige goedgekeurde animatiepakket staat in dezelfde bestaande Klink-projectmap. De aanvullende Drive-back-up wordt volledig teruggelezen, op SHA-256 en ZIP-integriteit gecontroleerd vóór publicatie.
