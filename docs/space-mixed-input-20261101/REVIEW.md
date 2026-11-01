# Spatie na afwisselend muis- en toetsenbordgebruik — 1 november 2026

Nico vraagt expliciet: spatie herhaalt de audio na een muiskeuze, ook na eerder Enter of de pijlen; behoud inhoud, audio en voortgang, controleer mobiel en publiceer. Het is een functionele reparatie zonder nieuwe vormgeving.

## Actuele basis

Tijdens de voorbereiding stond eerst 17f9db234295127531719cebb3df45d666d8ccac live. De afzonderlijk goedgekeurde schrijfbank en de kaarttitels zijn vervolgens via de canonieke main gepubliceerd. De reparatie gebruikt de werkelijk teruggelezen, schone livebron ded58bb090a90c87f6a5881b35830fa44f3b4de2 en behoudt ook het gecontroleerde metadataregister 62df6f0d9504a8f2ada15b07d75a3b39db398322. De goedgekeurde schrijfinhoud en sessieterugval, korte kaarttitels, loader, leerdoelen, herhaalrondes en hele vaste vloer blijven behouden. Geen terugval naar een oudere checkout of alternatieve publicatieroute.

## Oorzaak en minimale correctie

De live-demonstratie van lezen en Zoek hetzelfde woord toonde de ontbrekende combinatie: na eerder toetsenbordgebruik stond keyboardMode nog aan. Een later goed muisantwoord liet de oude focus-effect de aandacht opnieuw naar Verder verplaatsen. De volgende spatie activeerde dan de knop Verder volgens zijn native knopgedrag. De eerdere proeven controleerden de eerste spatie na een muisantwoord en misten deze afwisseling.

De gedeelde hook onthoudt nu uitsluitend of de laatste handeling de bestaande focusverplaatsing naar Verder nodig heeft. Een muis- of aanraakhandeling wist die tijdelijke markering. Herhalen met spatie zet de markering uit. De bestaande focus-effect gebruikt haar alleen voor de oorspronkelijke toetsenbordbediening. KeyboardMode zelf, automatische pauze en antwoordfeedback worden niet gereset. Enter bij een met Tab gekozen antwoord blijft de focus naar Verder brengen. Wie Verder bewust met Tab kiest, kan die knop nog steeds met spatie activeren. Een via spatie gekozen, nog niet geselecteerde antwoordknop behoudt native toetsenbordactivatie.

De wijziging bestaat uit één tijdelijke DOM-markering, haar opruimen bij pointerdown, en één extra voorwaarde in de bestaande focus-effect. Geen nieuwe toestand, listener, afhankelijkheid, instelling of UI-element. Alle vier hook-gebruikspunten krijgen dezelfde pointerafhandeling via de bestaande spread; alleen PackageExerciseBrowser heeft de betreffende focus-effect. Lees-/luisterbladen, bouwbladen en het afgeronde scherm houden hun bestaande bediening. Geen gewijzigde opslag, bron-/voortgangs-ID, migratie, beoordeling, audio-/afbreekhandler, route, opnamecontrole, stylesheet of uiterlijkreferentie. De vrijgave vergelijkt beide runtimebestanden met de exacte toegestane tekstwijziging tegenover de actuele livebasis.

## Bewijs

De voor-herstelproef vindt acht falende gemengde flows. De herstelde proef kiest met echte muisklikken op desktop en aanraakhandelingen op mobiel. Enter gaat naar de volgende opdracht; na een nieuwe keuze herhaalt spatie het geluid tweemaal zonder opdrachtwisseling of verlies van het goede antwoord. Daarna volgen → en ←, opnieuw kiezen en nogmaals spatie. In dezelfde flow testen gewone Tab-navigatie, native spatie op bewust gekozen Verder en Enter op een met Tab gekozen antwoord de behouden toegankelijkheid. Er wordt geen focus met een script gezet en Verder wordt niet met de muis aangeklikt.

Lokaal: acht gemengde flows in Chromium en WebKit, 1280 × 800 en 320 × 568; vier aanvullende gemengde flows met daadwerkelijk spelende oorspronkelijke audio op 390 × 844; veertien bestaande toetsen-/invoer-/opname-/voortgangsproeven; twee bestaande vooruit-tijdens-audio-proeven; 482 toetsen-/knopvergelijkingen over zestig renderervarianten. TypeScript, gerichte lint, exacte vrijgave-/herstelproeven, de volledige gewone publicatiepoort en productieopbouw worden uitgevoerd. Alle zware controles lokaal; geen GitHub Actions-workflows aanwezig of toegevoegd.

WebKit gebruikt Option-Tab om knoppen via de native browservolgorde te bereiken. De eerste testverwachting gebruikte overal Tab. Bij echte audio wacht de proef zowel op het werkelijke media-einde als op de bestaande vorige-knop die aangeeft dat de speler klaar is; WebKit kon het media-einde iets eerder melden dan het klaarzetten van de UI. De app is daarvoor niet vertraagd en de audio is niet vervangen of versneld. De mocks in de snelle matrix testen de bediening; de vier aparte native flows bewijzen daadwerkelijke audio en herhaling. De twee vooruit-proeven controleren ook het stoppen van de oude audio bij een goed antwoord.

De online herhaling gebruikt dezelfde geïsoleerde testopslag en dezelfde inputvolgorde. Geen bestaande cursistgegevens worden gewist of teruggezet. Alle release-inhoudsvingerafdrukken en geselecteerde werkelijk aangeboden inhouds- en audiobestanden worden tegen de huidige livebasis teruggelezen. De nieuwe schrijfbankbestanden blijven inbegrepen. Bronkopie, bronbundel en eindbewijs worden in de bestaande Drive-projectmap opgeslagen, volledig teruggelezen en per bestand gecontroleerd.

Geen fysieke telefoon, Bluetooth-toetsenbord of menselijke audiobeoordeling; de browserproeven gebruiken mobiele viewport en aanraking. Geen geluidsbestand opnieuw gemaakt of gewijzigd. De bestaande audio-/opnamebescherming en tekstinvoer blijven gelden. De app eenmaal vernieuwen om de nieuwe client te laden.
