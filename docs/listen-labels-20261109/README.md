# Duidelijke luisterknoppen — lokaal, 9 november 2026

Nico: “Ik zie twee luidsprekertjes en ik weet niet wat is wat. Dus dat moet anders opgebouwd worden.” Vervolg: “maak dit verder af en werk het uit”. Dit is een gericht lokaal zichtbaar herstel; geen nieuwe publicatieopdracht en geen wijziging van de vastgezette referenties.

## Basis en scope

Canonieke main e90ca897a4639e069d35d50d809abe99a3c4c816 is de bewijsopvolger van de actuele livebron e0f4e60920db5c712246144b371e85e5d3b72a7f. Op 9 november opnieuw live bevestigd, inclusief beide Cloudflare-versies: app b463285a-86c8-42d5-8d79-d643edd84db0 en audio 71b927fb-d3dc-4b2b-bfb4-2b5457bce845, beide 100%. Lokaal gewerkt op codex/duidelijke-luisterknoppen-20261109. Geen push, publicatie, cloudtestrun, betaalde dienst, configuratie- of budgetwijziging.

De gedeelde ExerciseListen kan op verzoek zijn bestaande naam zichtbaar tonen. Alleen de vier Alfa C-spelers gebruiken dit: functioneel, dagelijks, oorspronkelijke oefenreeks en begeleide docentopdrachten. Tekst horen, Uitleg horen en Voorbeeld horen onderscheiden de functies. Dictees houden hun afzonderlijke opnamen: Nummer horen, Zin horen of Luister 1/2/etc. De docentopdrachten tonen dezelfde volgorde ook zichtbaar. Alle handlers, audioadressen, toetsen, foutafhandeling en opslaglogica blijven exact staan. De knopnaam voor schermlezers is gelijk aan de zichtbare tekst.

Eén beperkte CSS-regel laat uitsluitend luisterknoppen met tekst meegroeien. Geen nieuwe kleuren, iconen, fonts of algemene herindeling. De bestaande mobiele tweede rij gebruikt haar bestaande verticale icoon/tekstindeling. Uitsluitend de bedoelde knoppen wijzigen zichtbaar; de vaste referentievloer blijft bewaard. De DigiBord-stijlreferentie was niet meer aanwezig op het oorspronkelijke pad; README en reference.png gelezen vanuit de bestaande Mac-back-up in Google Drive. Bestaande Klink-knopstijl hergebruikt.

## Ruimte en automatische bundeling

| Bestaand onderdeel | Bestanden | Gratis grens | Vrij |
| --- | ---: | ---: | ---: |
| App, materialen en audiobundels | 8.587 | 20.000 | 11.413 |
| Bestaande losse audio | 13.831 | 20.000 | 6.169 |

Dit zijn afzonderlijke bestandsplaatsen, geen aantal mogelijke lessen of gigabytes. De telling komt uit de gecontroleerde livepublicatie; de nieuwe lokale bouw geeft dezelfde aantallen. Cloudflare bevestigt 20.000 Static Assets per Worker-versie op Free, maximaal 25 MiB per bestand. Statische aanvragen zijn gratis en onbeperkt; dynamische appaanvragen hebben afzonderlijke gratis grenzen. Bronnen: https://developers.cloudflare.com/workers/platform/limits/ en https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/ (9 november gecontroleerd).

Nieuwe materialen kunnen via de normale gecontroleerde publicatieroute worden toegevoegd. De prebuild bouwt automatisch bundels van nieuwe, toegelaten MP3/WAV-bestanden in public/package-audio van maximaal 128 KiB per bronbestand (uitgezonderd listen-ready.wav). Grotere bestanden en andere formaten blijven los. De bestaande 13.831 directe audiobestanden blijven behouden voor oude links; bundeling verwijdert die niet. Nieuwe nooit eerder gepubliceerde korte bestanden hoeven niet ook los gepubliceerd te worden: Klink resolveert hun geregistreerde koppelingen naar de bundel. Nieuwe externe downloads mogen niet zonder controle naar zo'n weggelaten los bronbestand verwijzen.

Bundeling gebeurt tijdens bouwen, niet bij een willekeurige Drive-upload. Inhoud, metadata, koppelingen en nieuwe onveranderlijke bundelbestanden moeten vóór publicatie door de bestaande review en retentiecontrole. Publiceer samenhangende materiaalbatches: een losse kleine toevoeging kan door nieuwe indexbestanden juist extra plaatsen gebruiken. Er is geen vast aantal toekomstige opnamen uit de vrije plaatsen af te leiden.

De lokale bouw/publicatiecontrole waarschuwt afzonderlijk bij 18.000 bestanden en blokkeert boven 20.000. Dit is een ontwikkel-/publicatiemelding, geen e-mail of permanent zichtbare appmelding. Geen betaalde opslag nodig voor deze structuur. Volledige accountfactuur en abonnementen blijven niet onafhankelijk uitleesbaar (403); geen budgetten gewijzigd.

## Lokale controle en herstel

De tests en concrete screenshots staan in outputs/listen-labels-20261109 en in de gecontroleerde Drive-reservekopie. De afbeelding van het briefje en alle andere bestaande broninhoud/media blijven bytegelijk. De bestandsvergelijking dekt 22.373 publieke bronbestanden, inclusief alle 13.831 oorspronkelijke audio-assets en alle 4.025 bundel-/indexassets; gegenereerde appcode en releasegegevens mogen alleen voor deze wijziging verschillen.

De eerste proef ontdekte dat de oude lange knopnaam “Luister naar het nummer” met zichtbare tekst Help buiten een 320px scherm duwde. Hersteld naar Nummer horen (en Zin horen); de eindcontrole neemt alle vier dictees en hun voorbeeldstand mee. De eerste nieuwe test had type-inferentiefouten in lint; de testscenario's gebruiken nu objecten, zonder wijziging van appgedrag. De eerste paneeltest startte vóór de proefserver gereed was; opnieuw uitgevoerd na gereedmelding. Twee aanvullende testaannames zijn gecorrigeerd: op mobiel blijft Nu jij in het bestaande Opdracht-paneel, dus modelopening wordt via aria-expanded gecontroleerd; bij dictees wacht toetsenbordfocus tot de volgende knop na afspelen werkelijk weer ingeschakeld is. Er zijn hiervoor geen apphandlers gewijzigd.

Geen volledige publicatiepoort uitgevoerd: deze lokale branch heeft geen opvolgende vrijgave voor de nieuwe visuele wijziging. Historische publicatiebeveiligingen en referenties blijven ongewijzigd. Geen fysieke telefoon/stylus of nieuwe menselijke luisterreview; bestaande audiobytes blijven gelijk. Voor later publiceren: opnieuw actuele livebasis controleren, de exacte lokale wijziging vrijgeven via de normale opvolgende publicatiepoort, benodigde lokale publicatiecontroles uitvoeren en pas daarna canonieke main/publicatie bijwerken.

Eindresultaat: bouw en typecontrole geslaagd; lint zonder fouten (twee bestaande waarschuwingen in historische diagnosebestanden). 1.200 paneelcontroles, 160 knop-/scherm-/voorbeeldgevallen, 4 native tekst/uitleg/toetsen/herlaadgevallen, 4 echte interactie-/opslagproeven, 16 beeldwoord-/toetsen-/herlaadproeven, 8 docent/oefenreeksgevallen, 18 native dicteeproeven en 23 bundel-/statische unitcontroles geslaagd. Zie result.json en de ruwe controles in de reservekopie.
