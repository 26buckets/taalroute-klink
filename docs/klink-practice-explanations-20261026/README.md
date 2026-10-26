# Zes oefenuitleggen — lokale review, 26 oktober 2026

Opdracht van Nico: de goedgekeurde animaties opnemen bij de zes stappen,
met behoud van de bestaande indeling; de hand dekkend neutraal kleuren.

De zes bestaande kaarten op Start openen nu hun eigen uitlegvenster.
Sluiten keert terug naar dezelfde kaart, focus en schermpositie.
De oefenknoppen binnen lessen blijven echte stapnavigatie.
De gedeelde cursor is dekkend grijs (#b8bec5); alle vier toepassingen zijn
opnieuw bekeken, inclusief vingers, duim, pols, aanwijscontact en beeldgrenzen.
De overige twee animaties bevatten een potlood of natuurlijk afgeschermde handen.
Geen nieuwe audio, foto, leerinhoud, opslag of wijzigingen aan logo D.

## Bron en herstel

- Livebasis gecontroleerd via release.json: 346791a4b3952a3cc46d25ca419ac88ecbcc6efd.
- Werkbasis: f76e30f459cbaab37606994eb30f9432e8eda4b5, afstammeling daarvan;
  het verschil met de livebasis bestaat uitsluitend uit publicatiebewijzen.
- Canoniek: 26buckets/taalroute-klink, main. Werkbranch: codex/klink-oefenuitleg-20261026.
- De eerste lokale gedeelde kloon bleek onbruikbaar door een onvolledig packbestand
  in een oudere bronkopie. Implementatie en tests gebruiken een afzonderlijke,
  schone kloon van GitHub: work/klink-current in het animatieproject.
- Niet gepusht of gepubliceerd. Geen GitHub Actions gestart of gewijzigd.
- Vóór eventuele publicatie opnieuw de livebasis vergelijken en de bestaande
  publicatieroute volgen. Dit document is geen publicatievrijgave.

## Verificatie

- Chromium, WebKit en Firefox: zes stappen op 320, 390, 768 en 1366 pixels;
  toetsenbord, focus, sluiten/Escape vanuit de ingebedde uitleg, geen overloop,
  grijze hand, behoud route en lokale gegevens.
- Minder beweging, vier stilstaande beelden, afspelen/pauze/opnieuw en einde op 9 s.
- Bestaande routepaneel- en beeldgidscontroles: geslaagd, inclusief echte
  stapnavigatie, docentomgeving, vijf navigatieknoppen en logo-afmetingen.
- Kaartposities, maten en typografie vóór/na op vier breedtes: identiek.
- 181 tijdstippen per animatie: handen blijven binnen beeld; keuze vóór feedback.
- Curriculum: 54 geslaagd, één bestaande test overgeslagen; geen mislukkingen.
- Types, lint van gewijzigde bestanden en productiebuild: geslaagd.
- Brede lint: vier bestaande fouten in ongewijzigde scripts
  test-dialogue-repair.mjs (twee ongebruikte imports),
  check-practice-availability-release.mjs en check-self-listening-release.mjs
  (sort zonder vergelijkfunctie). Geen uitbreiding van de reparatiescope.
- Alle vijf inhoudskenmerken uit release.json gelijk aan de livebasis.
- Geen echte schermlezer, fysieke telefoon of cursistenproef uitgevoerd.
  Begrijpelijkheid en zelfstandige toepassing blijven praktijkvragen.

## Uitvoering van de browsercontrole

Start de lokale app. Voer scripts/test-practice-explanations-browser.mjs uit
met KLINK_TEST_URL naar de lokale poort. PLAYWRIGHT_MODULE kan naar een bestaande
Playwright-installatie wijzen; FIREFOX_PATH kiest zo nodig de geïnstalleerde Firefox.
De test gebruikt standaard de drie engines; alle controles blijven lokaal.

De bewerkbare animaties staan in public/practice-explanations.
Het losse voorbeeld, bronwijzigingen, herstelpatch, screenshots en meetgegevens
worden samen in de bestaande Drive-projectmap Alfabeta+ Klink geback-upt.
Uploadcontrole wordt naast het ZIP-pakket vastgelegd; back-up is geen publicatie.

## Laatste bijstelling — lichtgroene hand, compact venster

Nico koos daarna lichtgroen met een donkergroene rand en een kleinere pop-up.
De cursor gebruikt nu #c9ddd2 / #244b43. Het venster is maximaal 640 × 600 px
(was 850 × 760), begrensd door het scherm. Alleen de uitleg is compacter;
de zes kaarten en de rest van de app blijven staan. Knoppen behouden hun
bedieningsmaat. Animaties en stilstaande beelden blijven dezelfde.
De bestaande browsercontrole opnieuw geslaagd in de drie engines op vier
breedtes, inclusief focus, Escape, opslagbehoud, afspelen en minder beweging.
Alle zes beelden en de vier zichtbare cursorhanden opnieuw visueel bekeken;
de ongewijzigde anatomie en aanwijscontacten blijven intact. Ook vensterresize
gecontroleerd. Geen inhoudswijziging: curriculum/build niet opnieuw gedraaid.
De eerdere geslaagde controles en bestaande lintbeperkingen blijven gelden.
Nog steeds uitsluitend lokaal, zonder publicatie of push.
