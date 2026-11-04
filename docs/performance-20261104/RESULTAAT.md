# Klink en Klink+docent — snelheidsresultaat 4 november 2026

Reviewbaar vervolg op bestaande draft PR10. Geen deployment, merge, productie- of stagingmigratie. De lopende inhoudschat is afgestemd; basis is live8fb4f020 en de uitsluitend bewijs toevoegende mainc2e296cb. De aparte actuele Inzicht-app krijgt een eigen concept-PR; PR8 blijft ongewijzigd op c8ed69a4.

De definitieve klok meet in de browser het moment waarop het juiste scherm zichtbaar is en de loader verdwenen is. Eerdere tijden met pollingvertraging zijn apart bewaard en geen eindresultaat. Elke variant heeft 72 metingen (Chromium/WebKit, 1280/390px, eerste/herhaald bezoek, drie herhalingen). Per onderstaande rij n=24. Alleen lokale productiebuilds; geen garantie voor fysieke telefoons of ieder netwerk.

| Scherm | Actuele basis | Alleen pauze verwijderd | Met afzonderlijk laden | Volgende handeling basis → kandidaat |
|---|---:|---:|---:|---:|
| Start | 2.086 s | 0.082 s | 0.088 s | 2034 → 1756 ms |
| Klink oefenen | 3.156 s | 1.906 s | 1.616 s | 40 → 38 ms |
| Klink+docent | 2.388 s | 0.720 s | 0.739 s | 29 → 32 ms |

De vaste openingspauze is weg; de juiste les-/appcode en veilige herstelcontrole moeten wel gereed zijn. De loader behoudt zijn eenmalige animatie en het eindbeeld bij volgende laadmomenten. De aanvullende splitsing geeft in deze reeks vooral bij Klink oefenen winst; docentschermen veranderen minder. Kleine verschillen in vervolgknoppen zijn geen betekenisvolle regressie; deze kolom omvat ook testbesturing. Volledige eerste/herhaalverdeling en spreiding staan in summary.json en de gecomprimeerde ruwe metingen.

## Aansluiting op de volgende inhoudsbatch

Na het vrijgeven van het meetvenster publiceerde de onafhankelijke inhoudschat de volgende letterbatch. Main 054739501d803509844d5c0c18e0e77ec7b8b098 is daarom ook in deze kandidaat samengevoegd. Alleen de vier aangekondigde databestanden veranderden in runtime; alle performancebronbestanden blijven bytegelijk. Op die nieuwste inhoud slagen opnieuw de productiebuild, 32 units, 16 laad-/voortgangsstromen en 44 woordaudio-browsercontroles. Alle actuele data, assets, API, configuratie en migraties zijn exact behouden. De bovenstaande vergelijkbare timings blijven expliciet bij de eerdere vastgezette 8fb4f020-basis; ze zijn niet stilzwijgend als nieuwe inhoudsmeting hernoemd.

## Audio en behoud

De bestaande complete HTTP200-bundelfallback wordt maximaal 8 MiB hergebruikt. Exacte rangecontrole, maximumgrootte, annulering en herstel na beschadigde data blijven behouden. De actuele MP3- én WAV-herkenning is behouden. De eerste download wordt hierdoor niet structureel kleiner; correcte HTTP206-antwoorden worden niet als complete bundel opgeslagen.

De MP3-proef omvat 12 native browsersessies, elk drie echte afspeelbeurten. Aanvragen: 3 → 1; bytes 6.266.631 → 2.088.877. De mediane tweede afspeelstart was 195 → 142 ms met een gecontroleerde HTTP200-response en 100 ms vertraging. De eerste afspeeltijd is geen bewezen cachewinst. Ook WAV slaagt in 12 sessies: 3 → 1 aanvraag; 9,139,086 → 3,046,362 bytes. Alle 72 MP3/WAV-afspeelbeurten per versie samen gebruiken de oorspronkelijke opnamen. Zie audio-summary.json voor de exacte tijden en bronnen.

Geslaagd: 32 gerichte unittests, 16 laad-/voortgangsstromen, 16 echte one-shot-loadergevallen, 8 vertraagde navigatiestromen, 44 woordaudio-browsercontroles en 24 pixel-identieke desktop/mobiel licht/donker-schermparen. Types, runtimegerichte lint en productiebuilds slagen. De woordfixture gebruikt de bestaande gevalideerde banklezer voor de nieuwste serverbanken. Geen inhoud, assets, stijl, opslagcontract, authenticatie, configuratie of migraties gewijzigd. Preservatiehashes en testlogboeken staan bij dit verslag; complete screenshots en ruwe gegevens komen in de geverifieerde Drive-herstelkopie.

## Wat blijft open

- De grote oefenbank blijft groot (circa 28 MB ongecomprimeerde JavaScript over de volledige gemeten oefenstroom). Deze wijziging is geen volledige inhoudssplitsing per oefening.
- Fysieke telefoons en Nico's nieuwe netwerk zijn niet getest. Browservensters en gecontroleerde vertraging vervangen geen apparaatproef.
- De afzonderlijke Inzicht-startwinst betreft twee publieke bestanden; geen nieuwe claim over MFA, sessies of dossierquery's. De eerdere PR8-stagingreparatie is behouden en niet opnieuw uitgerold.
- Voor een latere publicatie blijven afzonderlijk akkoord, vergelijking met de dan actuele main/live, de gewone volledige publicatiepoort en livecontroles nodig. Geen bestaande publicatiebeveiliging aangepast of omzeild.

Er zijn geen GitHub-workflows aanwezig op de gecontroleerde branches, geen nieuwe workflows toegevoegd en geen zware cloudcontroles gestart. Methodische details en oorspronkelijke afgekeurde meetpogingen: METHODE.md en herstelarchief.
