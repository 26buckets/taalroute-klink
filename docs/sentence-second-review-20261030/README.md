# Tweede beoordeling van de 62 zinnen — 30 oktober 2026

Opdracht: loop de 62 twijfelgevallen kritisch na, herstel onduidelijke zinnen en hun gekoppelde oefeningen/audio, en toon alleen overblijvende inhoudelijke beslissingen voor Nico. Geen nieuwe publicatieopdracht. Werkbranch: `review/sentence-levels-20261030`; uitgangscommit `152acc92`.

## Uitkomst en grenzen

Alle 62 eerdere voorlopige besluiten zijn redactioneel afgehandeld: 14 zinnen verduidelijkt en opnieuw opgenomen, 48 teksten/opnamen behouden. Geen inhoudelijke keuze voor Nico overgebleven. Dit is een redactionele AI-beoordeling; onafhankelijke menselijke NT2-validatie, praktijktoetsing en menselijke luisterreview zijn niet uitgevoerd. De 14 nieuwe bronnen dragen daarom `humanReview: open`, geen verzonnen menselijke goedkeuring. Geen volledige nieuwe beoordeling van de 192 teksten, 128 dialogen en geïmporteerde lessen.

De complete losse-zinnenbank telt 1.225 A1 en 67 A2. Alfa-leesfasen, woordvoorbereiding, leesstappen en begeleide toegang blijven intact. Een taalniveaulabel geeft geen zelfstandig-lezen-vrijgave. De expliciete voorbereiding per twijfelgeval wordt ook doorgegeven aan de gekoppelde opdrachten. Bij de nieuwe zin over Fatima is het bezittelijke `haar` afzonderlijk verantwoord.

`decisions.json` bewaart alle 62 eerdere en huidige teksten, niveaus, redenen en voorbereidingsnotities. `source-amendments.json` bevat de 176 exacte bron-/route-/audioregistervelden die veranderen. De overige bronvelden zijn tegen de uitgangscommit gecontroleerd. `runtime-amendments.json` bewaart het verschil tussen alle afgeleide oefeningen: alle 46.143 eerdere unieke sleutels behouden, 269 bestaande oefeningen met gekoppelde veldwijzigingen, twee extra zinsbouwoefenplaatsen voor dezelfde rijk-zin. Volledige plaatsingen: 47.041 → 47.043; unieke sleutels: 46.143 → 46.145. Dit zijn geen aantallen unieke bronzinnen.

## Audio en herstel

Doeltaalstem Remko `0qLmDzgqulxcvv0yf3kg`; instructiestem Roland `h6uBOiAjLKklte8hdYio` blijft onderscheiden en is niet opnieuw geproduceerd. Model, tekst en instellingen zijn vooraf vastgelegd in `production-plan.json`. De 14 definitieve bestanden staan in `public/package-audio/zinsherstel-20261030/`.

`originals/` bevat de nieuwe ongetagde originelen; `previous-audio/` de 14 voorafgaande opnamen; `superseded/` drie vervangen tussentakes. Alleen de definitieve 14 openbare paden zijn actief. Lossless metadata: artiest, albumartiest en uitgever Taalroute, album Klink - Taalroute; audio-pakkethashes vóór/na tagging gelijk. Dit is daadwerkelijk opnieuw gemeten met ffmpeg/ffprobe.

`final-transcript-check.json` is de definitieve automatische transcriptcontrole. De drie herziene eindtakes hebben afzonderlijke `zin-XX-transcript.json`-bestanden; de overige elf verwijzen naar de gezamenlijke oorspronkelijke transcriptie. `review.wav`, `windows.json` en `transcript-check.json` zijn de eerste controle, niet de eindversie van zin-04/50/51. Valutanotatie € 2,50 is expliciet gelijkgesteld aan de uitgesproken woorden; verder alleen hoofdletter-/interpunctienormalisatie. Automatische transcriptie en afspelen bewijzen geen menselijke beoordeling van intonatie.

## Controlebeleid

Alle zware controles lokaal; niets gepusht en geen GitHub Actions gestart. De bestaande publicatiebeveiligingen en eigenaarvrijgaven zijn niet aangepast. `check-sentence-revision.mjs` dient alleen voor tests: exact gecontroleerde nieuwe velden teruglezen vóór historische behoudsvergelijkingen; het verwerpt afwijkingen zowel binnen als buiten de herstelset. Dit is geen publicatievrijgave of omzeiling. Nieuwe publicatie vereist actuele vergelijking met de dan werkelijk live staande bron en afhandeling van het publicatiecontract.

De algemene lintcontrole van de uitgangsversie heeft 318 fouten; deze werkversie 294, zonder nieuwe foutsoorten per bestand. De gerichte controle voor de gewijzigde code en nieuwe tests slaagt. Bestaande algemene lintschuld is niet stilzwijgend als geslaagd aangemerkt. Een eerste browserpoging werd onderbroken toen lokale schijfruimte opraakte; uitsluitend opnieuw op te bouwen bestanden van deze taak zijn verwijderd/gecomprimeerd en de onvoltooide audiobrowsercontrole is opnieuw uitgevoerd. De afgeronde niveaucontrole bleef behouden.

Het leesbare overzicht en de twee CSV's staan in de workspace onder `outputs/klink-twijfelgevallen-herstel-20261030/`. De back-up bewaart overzicht, bron, audio, herstelgegevens en Git-bundle samen; lees `backup.json` voor de teruggelezen SHA-controle. Bestaande back-up met de voorgaande review: Drive-bestand `1vAkyE8st4QnHXFO7eFDtGtGMs3OAuxX2`; volledige voorgaande herstelbasis: `1H99PXPETVdzLxDyO11VOB-L_Iq-5faeb`. Een back-up is geen livepublicatie.

## Afgeronde lokale controles

74 tests geslaagd, 0 mislukt, 1 historische bronledger-test overgeslagen omdat die oude losse ledger niet in deze checkout staat; de actuele bron is wel volledig tegen Git vergeleken. Na de controle op tekstgebonden voorbereidingsnotities nog 10 gerichte tests geslaagd. 48 niveau-/oude-routecontroles en 56 bronzin-/audio-/bestandscontroles in Chromium en WebKit op 1366×768 en 390×844: geslaagd, geen JavaScript-fouten. Het overzicht is op 1280 en 390 breed gecontroleerd, inclusief 62/14/48-filters. Een tussentijdse audiobrowsertest herlaadde pagina’s voordat imports klaar waren; de test gebruikt nu één volledige navigatie per geval en is zonder fouten herhaald. Geen foutmeldingen weggefilterd. Types en gerichte lintcontrole geslaagd. Zie verification.json en checks/.
