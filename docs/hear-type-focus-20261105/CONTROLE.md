# Klink — vlot doorwerken bij Hoor en typ

Opdracht Nico, 5 november 2026: na het luisteren direct kunnen typen; Enter controleert; nogmaals Enter gaat naar de volgende vraag. Bestaand publicatieakkoord blijft van toepassing. Geen nieuw vormgevingsakkoord nodig voor deze functionele reparatie.

De gedeelde antwoordbediening is aangepast voor woord- en zinsdictees. De eerste voltooide luisterbeurt, herhaling en herstel na een fout antwoord geven de cursor terug aan het antwoordveld. Een bewuste verplaatsing naar Help of een andere vraag blijft staan. Bestaande tekst en cursorpositie worden niet geselecteerd of overschreven. De bestaande Enter-bediening en de afhandeling van antwoorden zijn behouden.

Bereik: 91 woorddicteerondes met 603 aangeboden woordvragen; 31 luisterrondes met 1.332 aangeboden zinsvragen. De twee overschrijfrondes met twintig zinsvragen vereisen geen luisteren en vallen buiten deze focuswijziging. Deze catalogustellingen zijn aangeboden posities, geen verklaring van unieke bronvragen.

De onlangs toegevoegde reeks bevat precies 50 woordvragen in negen dictees: zeven blokken van zes en twee blokken van vier. Advies voor de aanduiding: ‘9 woorddictees · 50 woordvragen’. Er zijn geen 300 vragen toegevoegd.

Bewijs: de oude bediening laat de focus na het luisteren op de luisterknop (local/before.json). De nieuwe bediening is gecontroleerd met 482 oefenstappen over alle 122 luisterrondes (gesimuleerde audio), 268 stappen en 52 opdrachten op één blad met echte audioweergave, tien focusbehoudcontroles, vier echte audiofout/herstelgevallen, zes opslagcontroles, acht Help-controles, 49 curriculumtests en zeven schrijf-/navigatietests. Typecontrole, lint en normale productiebuild zijn geslaagd. Vergelijkingen van de bestaande opmaak staan apart in local/appearance.

Inhoud, audio, merkmetadata, routes, opslagcode, CSS, logo en vastgezette vormgeving zijn ongewijzigd. Geen nieuwe dependencies of GitHub Actions-workflows. Uitgebreide controles zijn lokaal uitgevoerd; geen betaald cloudgebruik aangezet. De normale publicatiebeveiliging is uitgebreid met een brongebonden vervolgcontrole; bestaande bewijsstukken blijven behouden.

Niet gecontroleerd: het openen van het schermtoetsenbord op een fysieke telefoon. Mobiele vensters en aanraking zijn in Chromium en WebKit gecontroleerd. Er is geen nieuwe menselijke luisterreview uitgevoerd en geen audio gewijzigd.

Herstelbasis: livebron 60c12280847ee54725df9830f1666a7ebfdcfa58. Het herstelarchief bevat alle gewijzigde bestanden, controlebewijs en een Git-bundel vanaf die basis. De reeds aanwezige bron, inhoud en media blijven in de canonieke repository en de bestaande Drive-projectmap behouden.
