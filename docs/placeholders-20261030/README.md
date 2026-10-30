# Bèta: woordafbeeldingen en oefenoverzicht — 30 oktober 2026

48 complete, eerder gecontroleerde praktische woordenlijsten zijn hergebruikt op hun bestaande niveaus. Vier aanvullende beeldvormen leveren 192 reeksen en 1.920 oefenplaatsen. 372 verschillende woorden: 73 bestaande afbeeldingen en 299 tijdelijke woordafbeeldingen. De eerder afgewezen bonfoto krijgt hier ook een woordvak; oude livebestanden zijn niet vervangen.

Het register `registry.json` houdt per woord de bronbetekenis, huidige afbeelding en alle lijst-/niveaukoppelingen bij. Een tekstvak telt niet als afgeronde fotoproductie of als bewijs van zelfstandige beeldherkenning. Uitgebreide scènes en onvolledige spelborden blijven apart; geen bronlabels of antwoorden verzonnen.

## Herstel en vervanging

Gebruik de actuele canonieke main en controleer release.json vóór verdere publicatie. Behoud collection-ID, exercise-ID, bronwoord-ID, betekenis en niveau. Bij een nieuwe afbeelding: beeld- en volledige handencontrole, canonieke mediakoppeling beoordelen en alleen daarna opnieuw genereren met `build-word-image-beta.mjs`; verwijder de betreffende tijdelijke status. Nieuwe inhouds-URLs moeten in de bestaande voortgangsalias-koppeling worden meegenomen zodat een vervanging geen afrondingen wist. Bestaande publieke bestanden blijven bewaard. Genereer daarna het overzicht opnieuw met `build-practice-overview.mjs`. Controleer tellingen, alle gewijzigde oefenvormen, terugkeer, afspeelknoppen en korte schermen.

De vierkante SVG-bestanden zijn gewone bewerkbare tekstbestanden. In de speler wordt de woordtekst als leesbare tekst over een vierkant grijs vlak weergegeven; zo krimpt de tekst niet mee tot onleesbare miniatuurletters. Geen nieuwe audio of AI-afbeeldingen gemaakt.

## Beeldcontrole

Alle 74 aangetroffen woordbeelden bekeken; de bon is uitgesloten uit nieuwe plaatsingen. Alle 23 beelden met zichtbare handen inclusief de winkelfoto hebben detailuitsneden. Vingerverbindingen, duimzijde, polsen, grepen, ondersteuning, blik en gebruiksrichting zijn nagekeken; natuurlijke afdekking blijft intact. De overige 50 behouden beelden bevatten geen relevante zichtbare handen. De bestaande beelden zijn niet bewerkt. Zie `image-review.json` en `image-details/`. Kleine bronhanden worden niet als hoger gedetailleerd voorgesteld doordat een uitsnede groter is weergegeven.

## Grenzen

Dit is bèta-inhoud, geen nieuwe niveau-certificering. Losse klankopnamen m/a/t voor Klink Plus docent blijven open. Geen fysieke klasmonitor of cursistenpilot. De 500 overige scènebeelden, 91 overige parenrondes en 341 voorbereide fotobingoborden zijn productievoorraden en niet automatisch vrijgegeven door deze woordplaceholder-opdracht. Alle zware controles lokaal uitgevoerd; geen GitHub Actions-workflows toegevoegd.
