# Klink+docent — rustige leskaart

Opdracht Nico, 31 oktober 2026. Lokale ontwerpuitwerking; niet gepubliceerd.

## Vaste opzet
- Eén compacte naam: Klink+docent, met het bestaande officiële Klink-beeldmerk en kleine d. Geen vervangend lettertype voor Klink.
- De appmenulink Oefenoverzicht · bèta vervalt. Het historische bestand is niet verwijderd.
- Lessen en Werkbladen delen de bestaande cursistenopmaak: vaste navigatie en één inhoudsgebied. Terug naar Klink blijft beschikbaar. Handleiding verwijst naar Studio. Geen fictieve docentnaam of accountkaart.
- Leskeuze toont een foto, lestitel en Les openen. Geen verplichte voorbereiding.
- Het bord heeft één vaste kaart. Woord, Zin en Tekst blijven zichtbaar; Kies onderdeel ontsluit de acht bestaande fasen. Hulpmiddelen ontsluit de bestaande vijf borden en Andere hulp. Eén menu tegelijk; Escape sluit het menu.
- Foto links en woord rechts op het digibord; op smalle schermen vloeit de inhoud onder elkaar. Grote projectietekst blijft behouden. Vorige, huidige fase/teller en Volgende staan onderaan dezelfde kaart.
- Lesoverzicht sluit de actieve projectie en keert terug naar de leskeuze. Rondes, inhoud, media, voortgang en bescherming van docentinformatie blijven bestaan.
- Werkbladen blijven onafhankelijk van de bordles. Hun afdrukopmaak blijft buiten de appnavigatie.

## Bronnen en grenzen
Basis is de actuele cursistenapp-checkout, gebaseerd op canonieke main 70a37c41, met de eerder gecontroleerde inventaris/naamwijziging f514622f. Dit is geen publicatiebasisverklaring: vóór publicatie opnieuw livecommit en afstamming controleren en de actuele canonieke wijzigingen integreren.

De opgegeven lokale DigiBord-stijlmap is op deze computer niet gevonden. Daarom zijn de reeds aanwezige cursistencomponenten, lettertypes, knoppen en Lucide-iconen hergebruikt. Er zijn geen nieuwe media of lettermerken gemaakt.

De eerdere inventaris blijft gelden: acht unieke lessen aangetroffen, alleen mat gekoppeld aan de huidige bordmotor. Deze vormgevingswijziging voegt geen ongecontroleerde lessen toe.

## Lokale controles
- Chromium en WebKit: acht schermreizen, 320–1366 pixels, 192 faseweergaven en 40 hulpmiddelopeningen; menu, vaste kaart, pauze, opgeslagen letters en herladen.
- Bestaande volledige bordcontrole: zes schermreizen met drie rondes, zinnen bouwen, routebescherming, afronden en opnieuw beginnen.
- Acht randgevallen: aanraak-slepen, toetsenbord, cameratoestemming en stoppen, vergroting, offline, defecte opslag en ontbrekende audio.
- Veertien controles van echte browserweergave van klankaudio, opslag en herstel.
- Afdrukweergave: drie routes × drie materiaalsoorten in beide engines, zonder afgesneden scrollcontainers.
- Zes inhoud-/opslag-unittests en TypeScriptcontrole. Gerichte lintcontrole heeft alleen de twee reeds bestaande Image-priority-deprecatiemeldingen in de header; geen nieuwe meldingen.
- Geen fysieke telefoon, echt digibord, printer of klasproef getest. Controlegegevens en screenshots staan in het herstelpakket. Print-PDF’s daarin zijn uitsluitend technische controlebestanden, geen nieuwe drukuitgave.

## Publicatie en herstel
Geen push, cloudcontroles of deployment uitgevoerd. Er zijn geen GitHub Actions-workflows gewijzigd of gestart. Bronwijzigingen, herstelpatch, controlebeelden en deze afspraak worden in de bestaande Klink-projectmap op Drive opgeslagen en na upload teruggelezen. Een back-up is geen livepublicatie.
