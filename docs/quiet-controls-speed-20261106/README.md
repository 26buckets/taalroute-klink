# Stille knoppen en onbedoelde netwerkpieken — 6 november 2026

Uitsluitend staging en review. Geen productiepublicatie, merge, D1-, R2-, abonnements- of routewijziging. Afgestemd met de publicatiechat en het aparte gratis-capaciteitsonderzoek.

## Actuele bron en reikwijdte

- Main: `78d139ae947e6a46dc3a0a06d4fc5c74fce2786d`.
- Productie: `7e87eca15c1e5d63fe2b68d6623d9cce0334bce2`, bij eindcontrole ongewijzigd.
- Vorige schone stagingruntime / controle: `a0656025cdd1c74581ac9a214109148d3ec35964`.
- Nieuwe schone stagingruntime: `cd876c71b19eeb2626f5396e8b2229d30658e13f`.
- Candidate Worker: `3b6d98a5-93d8-4845-9046-b303a153741e`; databasevrij op bestaande PR12-host.
- [Klink staging](https://klink-pr12-candidate.nico-554.workers.dev/#learner), [Klink+docent staging](https://klink-pr12-candidate.nico-554.workers.dev/#teacher/plus), [draft PR12](https://github.com/26buckets/taalroute-klink/pull/12).

Alleen de gedeelde WordListening-code is veranderd ten opzichte van de vorige runtime. Gewone knoppen, antwoordkeuzes, links, tabs, labels en andere bedieningsrollen worden niet meer door de algemene woordlezer uitgesproken. Dat geldt ook voor uitgeschakelde knoppen en handlers die click-bubbling stoppen. Knopacties blijven werken. Tekst buiten bediening blijft hoorbaar, ook over inline tekstopmaak heen. Expliciete luisterknoppen behouden hun eigen opname; woordluisterknoppen worden eenmaal afgespeeld. Het toetsenbord slaat gewone bediening over bij woordnavigatie. Lopende algemene woordaudio stopt bij bediening.

Geen gegevens, CSS, beelden, opnamen, oefenindeling, opgeslagen voortgang of authenticatie aangepast. Alle eerdere goedgekeurde inhoud, inclusief de 50 woordvragen, blijft via identieke databanken behouden. De gedeelde code is gemonteerd in de app; Inzicht gebruikt niet de algemene leerling-/docent-woordleesroots. Geen Inzicht-/PR8- of MFA-wijziging en geen nieuwe ingelogde Inzicht-browserproef geclaimd.

## Aantoonbare netwerkverbetering

Echte oefening: groep 1 → Oefenen met deze woorden → Woorddictee → tekst van de Help-knop. Verse Chromium-contexten, desktop 1280 px en touch 390 px, 3 Mbps down / 1 Mbps up en 40 ms extra vertraging, geen CPU-vertraging. Twee rondes per variant; ruwe gegevens in `help-before/`, `help-after/`, `help-before-confirm/`, `help-after-confirm/`.

| Bij klikken op Help | Voor | Na |
|---|---:|---:|
| Onbedoelde algemene woordaudio | 1 aanvraag per klik in bevestigingsronde | 0 |
| Onbedoelde audiobundel | 1 × 2.084.715 bytes | 0 bytes / 0 aanvragen |
| Tijd tot afronden van die extra download | 5,72–6,53 s | download vervalt |
| Hulpvenster opent | ja | ja |

Cloudflare antwoordde op de aanvraag met HTTP 200 en de complete audiobundel, zonder Content-Range. Dit verklaart waarom één kort woord een grote download veroorzaakte. De 600 ms observatietijd van de stille variant is een testvenster, geen gemeten opentijd of winstclaim. Geen claim dat alle netwerkpieken verdwenen zijn. De gebruikte test is eerst op een verkeerde oefening zonder Help-knop geprobeerd; deze locator-time-outs zijn bewaard, geen appfout en geen meetresultaat.

## Eerste opening blijft open

Afwisselende voor/na-proef: acht volledig nieuwe bezoeken, vier per variant, twee desktop- en twee mobiele bezoeken per variant. De volledige eerste oefening inclusief beelden/fonts en echte audio wordt gecontroleerd. De eerste twee bezoeken vielen deels samen met de afzonderlijke Help-nacontrole; daarom geen fijne snelheidsconclusie of causaal regressiesignaal op deze kleine steekproef.

| Eerste oefening volledig beschikbaar | Voor | Na |
|---|---:|---:|
| Mediaan | 7,64 s | 7,82 s |
| Bereik | 6,97–8,10 s | 7,17–8,02 s |
| Laatste klik tot volledige beschikbaarheid, mediaan | 1,06 s | 1,06 s |
| Totale transfer bij deze meting, mediaan | 2,403 MB | 2,408 MB |

Dit is geen aantoonbare versnelling van de eerste opening. De grote oefencode-/gegevensdownloads blijven de belangrijkste gemeten last: in een mobiele candidate-visit startten route-settings, woordbank en bronbank rond 2,05 s; zij bevatten samen ongeveer 1,36 MB gecomprimeerde gegevens. Route-settings eindigde rond 5,78 s, startscherm rond 6,31 s, oefenbeelden/player rond 7,1 s. Geen extra speculatief voorladen, runtimecompressie, betaalde opslag of proxy toegevoegd. De eerdere winst uit PR12 staat afzonderlijk in `docs/remaining-download-20261106/README.md` en wordt hier niet nogmaals als nieuwe winst opgevoerd.

## Controle

- Schone build en TypeScript geslaagd.
- Acht gerichte scenario’s: Chromium en WebKit × desktop/touch × leerling/+docent. Gewone en uitgeschakelde knoppen, stopPropagation, link, summary, label, rolknop en tab stil; acties blijven werken. Tekst en expliciete luisterknoppen werken met pointer en Enter. Alt+W slaat bediening over. Daarna in alle acht scenario’s echte audio tot playing/ended gecontroleerd, inclusief een koud geladen gebundeld woord.
- 24 oefenstromen voor nieuwe indeling geslaagd in Chromium/WebKit, vier schermmaten, woordmodel/antwoordkeuze/schrijven; aparte echte Chrome-audio, toetsenbord en fullscreen geslaagd.
- 32 pixel-identieke voor/na-schermparen, desktop/mobiel, licht/donker, start/leerling/docent/collecties.
- 203 volledige inhoudsvergelijkingen, twaalf identieke gebouwde databanken en alle CSS exact gelijk.
- Gerichte tekst-/beeldcoördinatenunitreeks en audiocachetests geslaagd.
- Koude/warme cachecontrole: beide browsers en beide werkplekken, vier bestaande gecomprimeerde moduleaanvragen koud, nul warm.
- 18.393 assets; geen nieuwe afhankelijkheid of workflow. Voor push: geen GitHub Actions-workflows aanwezig op feature/main; zware tests lokaal.

De historische brede woordluistersuite is aangepast aan het gevraagde stille-knoppengedrag. Zestien Chromium-checks slagen, maar de mobiele handschriftcheck raakt de hoofdcontainer in plaats van het woord in de afbeelding. Dezelfde geometrie/hit-test en ontbrekende audio zijn vastgesteld op beide runtimes; zie `image-diagnostic.json` en screenshots. Geen visuele reparatie meegenomen. De volledige historische suite wordt dus NIET als geslaagd geclaimd. De afzonderlijke acht actuele scenario’s met echte audio in beide engines zijn wel geslaagd. De oude inventarisgenerator verwacht inmiddels gebundelde losse JSON-bronnen en loopt op een ontbrekend oud pad; de actuele inhoud is afzonderlijk via de 203 vergelijkingen en twaalf gebouwde databanken gecontroleerd. Ook de eerder bekende Alfa-C-overlap en historische dialoogpublicatiecontrole blijven apart open.

## Serverkosten en vrijgave

Deze knopreparatie voegt nul Worker-/D1-/R2-aanvragen toe. Zij verwijdert de onbedoelde statische audiobundel-download bij deze knopactie. Alle audio blijft op bestaande opslag; niets opnieuw gegenereerd of gewijzigd.

De al bestaande PR12-compressieproef gebruikt nog vier Worker-uitvoeringen per volledig koud bezoek, nul voor die bestanden bij warm hergebruik. Dat is geen nieuwe toename door deze reparatie, maar blijft wel een verschil met productie. Statische assetaanvragen zijn volgens [Cloudflare](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/) gratis; `run_worker_first` kan Worker-verbruik veroorzaken en bij overschrijden van de Free-limiet 429 geven. Het accountabonnement en een afdwingbaar totaalplafond van €0 zijn niet bevestigd (abonnementsinzage eerder HTTP 403). Geen betaalde upgrade, budgetverhoging of nieuwe dienst. Het hele compressievoorstel is daarom niet als gegarandeerd kosteloze productieroute vrijgegeven.

Het parallelle gratis-capaciteitsonderzoek blijft apart: asset-only audiorouting en behoud van oude JSON-links zijn nog geen geteste of gepubliceerde oplossing. Geen duplicerend werk of routewijzigingen gedaan. Publicatie blijft op uitdrukkelijke opdracht uitgeschakeld. Open: eerste-openingdownloads en overige netwerkvariatie, fysieke telefoon, bestaande mobiele Alfa-C-beperking, kosteloze productieroute en normale publicatievrijgave.
