# Resterende openingstijd — 6 november 2026

Alleen staging/review. Geen productie, main-merge, D1-wijziging, audioverplaatsing of R2-instelling gewijzigd.

## Wijziging

De bestaande samenstelling van teksten, gesprekken, niveaureviews, plaatsingen en gespreksbeelden wordt tijdens de lokale build uitgevoerd. De browser krijgt dezelfde gecontroleerde uitkomst mee, zonder ook alle dubbele invoer-/reviewtabellen te ontvangen en samen te voegen. Alle bronvalidatie blijft bestaan; de build stopt bij waarden die niet exact kunnen worden bewaard. Geen nieuwe afhankelijkheid, eindpunt, opslagdienst of extra aanvraag.

De nieuwe oefenindeling, CSS, bronbestanden, media, ID's, antwoorden, niveaus, audioverwijzingen en opslag zijn behouden. De algemene/kolomsgewijze JSON-verpakkingsproef leverde onvoldoende winst op en is niet toegepast; `column-diagnostic.json` is uitsluitend onderzoek.

## Actuele basis

- Productie: `7e87eca15c1e5d63fe2b68d6623d9cce0334bce2`; main-bewijsopvolger `78d139ae947e6a46dc3a0a06d4fc5c74fce2786d`.
- Vorige PR12-review: `63f0f342b360b7bf7667975f4b2384b9429fcba2`; controlehost `6b112ca1e91b688898bd7726c0967ec2d445f8f5` heeft dezelfde relevante runtime.
- Primaire proef: `bc7d23cb96366f517f1d76436010aa23cf24c3ce`.
- Definitieve runtime: `a0656025cdd1c74581ac9a214109148d3ec35964`; alleen een extra build-time behoudassertie en tests na de primaire proef. De gegenereerde inhoudsmodule en CSS zijn exact gelijk. Een nieuwe framework-build-ID wijzigt wel afhankelijke bestandsnamen; volledige builds zijn niet byte-identiek geclaimd. De laatste build is daarom afzonderlijk opnieuw bezocht/gemeten.
- [Klink staging](https://klink-pr12-candidate.nico-554.workers.dev/#learner) · [Klink+docent staging](https://klink-pr12-candidate.nico-554.workers.dev/#teacher/plus).
- Definitieve staging-Worker: `35bed98e-6144-4b97-bd2e-6dae8b052255`. Databasevrij, uitsluitend testhost, geen productieroutes.

## Gemeten extra winst tegenover de vorige staging

Primaire proef: 24 bezoeken, acht per leerlingvariant en vier per docentvariant. Afwisselende volgorde, verse Chromium-contexten, breedtes 1280/390, nagebootst 3 Mbps download/1 Mbps upload en 40 ms toegevoegde vertraging, geen CPU-vertraging. Geen fysieke telefoon of echte mobiele verbinding. Zelfde eerste oefening/les, direct doorklikken, inclusief laatste klik, zichtbare geladen beelden en lettertypen. Echte oefenaudio daarna tot het einde afgespeeld.

| Mediaan tot volledig geopend | Vorige staging | Nieuwe variant | Verschil |
|---|---:|---:|---:|
| Klink eerste oefening | 8,00 s | 7,56 s | −0,44 s / circa 5,5% |
| Klink+docent eerste les | 10,90 s | 10,52 s | −0,38 s / circa 3,5% |
| Klink voltooide overdracht bij gereedheid | 2,54 MB | 2,40 MB | circa −0,14 MB |
| Klink+docent voltooide overdracht bij gereedheid | 2,94 MB | 2,81 MB | circa −0,13 MB |

Zeven van acht leerlingparen en alle vier docentparen sneller. Mediane gepaarde winst: respectievelijk 0,33 en 0,30 s. Laatste leerlingklik inclusief beeld: 1,072 → 1,065 s; docent circa 3,34 s in beide varianten. De winst is dus niet verkregen door de gemeten laatste klik over te slaan. Dit is extra winst bovenop het eerdere PR12-pakket, geen vergelijking met productie. Kleine steekproeven, geen statistische norm of gegarandeerde laadtijd. Eén nieuwe leerlingopening bleef juist trager door een hogere wachttijd vóór de pagina; pieken zijn niet bewezen verdwenen.

De vier gecomprimeerde modules worden samen 134.014 bytes kleiner in de primaire proef; 731.993 bytes minder uitgepakte code/data. Bestandsaantal blijft 18.393. Laatste build kan enkele compressiebytes verschillen door nieuwe framework-hashes. De resterende circa 7½ seconde is niet opgelost: andere gegevens, zichtbare media en netwerk-/paginawachttijd blijven meespelen. De actuele extra hercontrole staat afzonderlijk in `final-summary.json`; de primaire meting wordt niet achteraf vervangen door gunstiger runs.

## Hercontrole van de definitieve build

Nog twaalf afwisselende bezoeken op dezelfde 3 Mbps-instelling: Klink 8,20 → 7,76 s (vier paren, alle vier sneller); Klink+docent 11,03 → 10,84 s (twee paren, beide sneller). De extra Klink-winst blijft ongeveer 0,44 s in beide meetrondes. De docentwinst is kleiner in deze tweede, beperkte steekproef. Samen 36 bezoeken, zonder browserfouten; individuele pieken en fysieke apparaten vallen niet onder een algemene garantie.

## Behoud en tests

- Exacte vergelijking van alle zes voorbereide exports: alle 1.612 bronitems, velden, volgorde, kaarten, niveaus, audio en provenance. Negatieve proeven voor ontbrekende exports, undefined en niet-eindige getallen; foutieve toekomstige gegevens blokkeren de build.
- 203 volledige oefen-/collectievergelijkingen met de vorige goedgekeurde inhoud; twaalf volledige bankhashes in Chromium/WebKit. Alle 50 goedgekeurde woordvragen exact teruggelezen via de gebouwde Worker.
- 24 controles van de nieuwe oefenindeling in Chromium/WebKit en vier schermformaten; alle 32 hoofdschermparen pixel-identiek op desktop/mobiel en licht/donker. Geen vormgevingsreferentie aangepast.
- Echte audio, toetsenbordantwoord, volgende oefening en fullscreen gecontroleerd. Laatste gerichte unitreeks 15/15; TypeScript en schone builds geslaagd.
- Data, publieke media, opslagcode, appcomponenten en nieuwste productie-Worker zijn in deze iteratie ongewijzigd. Geen Inzicht/PR8-uitrol of nieuwe Inzicht-snelheidsclaim.
- Oude publicatiegerichte dialoogtest faalt op een historische mediavergelijking, ook op de ongewijzigde controle. De twee overige dialoogtests slagen. Niet als volledig geslaagd gerapporteerd, geen guard verzwakt. De nieuwe exacte inhoudsvergelijking en gerichte runtime-tests slagen. Bewijs van beide oude mislukkingen bewaard.
- De eerdere Alfa C-overlapbevinding is niet aangepast of opnieuw als opgelost opgevoerd. Hiervoor is afstemming gedaan met de chat voor de oefenindeling.

## Serverkosten

Deze wijziging voegt nul browseraanvragen, Worker-uitvoeringen, databasequeries of R2-operaties toe. Voorbereiding gebeurt lokaal vóór plaatsing. Het eerdere PR12-compressievoorstel behoudt vier Worker-uitvoeringen bij een volledig koud bezoek aan beide portalen; bij een herhaalbezoek komen die vier bestanden uit de browsercache. Acht koude/warme controles in Chromium/WebKit bevestigen dit. De pagina en andere aanvragen vallen buiten die telling. Geen compressie tijdens een verzoek.

[Cloudflare beschrijft](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/) gewone statische aanvragen als gratis; Worker-uitvoering telt mee en `run_worker_first` activeert die uitvoering. Ten opzichte van de vorige staging zijn er geen extra kostentriggers. Ten opzichte van productie blijft het eerdere voorstel vier Worker-uitvoeringen per volledig koud bezoek toevoegen; dat onderscheid blijft relevant vóór vrijgave.

Het parallelle R2-onderzoek leverde read-only accountbewijs. Accountinstellingen zijn leesbaar (`standard` is geen bewijs van een betaald abonnement); abonnementen blijven HTTP 403. Adaptieve analytics voor de voorgaande 30 dagen melden 90.570 Worker-aanvragen voor Klink, 1.880 voor kandidaatstaging en 1.170 voor controlestaging. Dit omvat tests, sluit louter statische aanvragen uit en is geen factuur of voorspelling van gebruikersvolume. Daarom geen gegarandeerd eurobedrag of kosteloosclaim. Zie `cost-evidence.json`. Geen abonnement, budget, R2-bucket of quota veranderd. Geen GitHub-workflows aangetroffen in main/head; zware tests lokaal.

## Afstemming en resterend werk

Chats voor oefenindeling en codekwaliteit/R2 bevestigden geen overlap met PR12/staging. R2 blijft in die chat alleen een onderzoek; deze proef verplaatst geen audio. Nieuwe vormgeving, live-timeoutreparatie en inhoud zijn behouden.

Voor eventuele publicatie blijven een expliciete vrijgave voor het concrete resultaat, de normale publicatiecontrole op de dan actuele main, kostenruimte en een fysieke telefoonproef nodig. Geen publicatiebeveiliging omzeild. Netwerkpieken en de resterende circa 7½ seconde blijven open. De bestaande Alfa C-bevinding en historische publicatietestachterstand blijven afzonderlijk vermeld.

Reviewcode, toepasbare patch, herstelbundle en volledige meet-/beeldbewijzen worden in dezelfde Drive-projectmap opgeslagen en teruggelezen. De opleverreceipt bevat de definitieve commit, links, hashes en verificatie.
