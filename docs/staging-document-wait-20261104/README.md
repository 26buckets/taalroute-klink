# Gecontroleerde stagingproef: wachttijd vóór de pagina

Proef gestart 4 november 2026, afgerond 5 november 2026 (Europe/Amsterdam).
Alleen twee nieuwe, afzonderlijke workers.dev-omgevingen. Geen productiepublicatie, merge, SQL, gegevensmigratie of wijziging aan bestaande Inzicht-staging.

## Reviewbare reparatie en bron

- Concept-PR: https://github.com/26buckets/taalroute-klink/pull/12
- Kandidaat: https://klink-pr12-candidate.nico-554.workers.dev/#learner
- Controle: https://klink-pr12-baseline.nico-554.workers.dev/#learner
- Vastgestelde main: `b085d626f591342e0be3aa32faa3bfe85342d5e9`.
- Controlebron: `27b78204e2fa317cbf0cd650b45495d7430203a8` (PR12 vóór de prepared-page/cache-reparatie).
- Eerste cache-only proef: schone bron `26f5a5695de936e693dc03c880520eaa8799162e`.
- Uiteindelijke stagingbron: schone bron `c266bef2739509be3dc08d606a461fc978d6c759`.
- Latere commits bevatten alleen tests en bewijsmateriaal; de broncommit in staging blijft bovenstaande runtimecommit.

`load-practice-workspace.ts` en `classroom-boundary.tsx` laden oefenmodules pas na browserhydratie. Expliciete Vite SSR-grenzen voorkomen dat hun complete browsergegevens ook in de serverbundel terechtkomen. Bestaande foutafhandeling, downloads, UI en opslag blijven behouden. `vite/client` levert de bijbehorende types. Geen nieuwe dependency.

Server-JavaScript: **36.969.874 → 6.248.646 bytes (−83,1%)**. De browsermodules blijven aanwezig. Alle **20.105 openbare bronbestanden behalve de veranderlijke release-provenance** zijn bytegelijk gebleven. De staging-assetlimiet blijft 20.000; dezelfde bestaande uitsluitingen zijn behouden. De uiteindelijke upload bevat 20.000 assets. Gecompileerde browserbestandsnamen veranderen door de moduleverwijzingen; daarvoor wordt geen byte-identiteit geclaimd.

## Waarom de eerdere cachefix niet genoeg was

`requests-round-1.json` bewaart de eerste, mislukte cache-only proef: 6 van 8 kandidaatpagina's duurden meer dan een seconde, ondanks 8 cachetreffers. De hoogste kandidaatwachttijd was 3,78 seconden.

Een tijdelijke diagnose op uitsluitend de nieuwe kandidaat-Worker is volledig teruggedraaid:

1. De volledige circa 37 MB Worker met een antwoord van enkele bytes bleef pieken (73–3.172 ms).
2. Dezelfde host en assets met een minimale Worker gaf 12 antwoorden van **77–161 ms**.
3. De gerichte uitsluiting van browser-only oefencode uit het echte serverpakket levert de onderstaande A/B-winst.

Dit wijst op het zware Worker-pakket als belangrijke oorzaak. De proef bewijst niet precies welke interne Cloudflare-startfase alle resterende tijd veroorzaakt. De diagnoseversies zijn nooit op productie gebruikt. De uiteindelijke staging draait de echte app, zonder diagnose-wrapper of ping-endpoint.

## Drie verse deployments per variant

Iedere ronde: 8 gepaarde HTML-aanvragen per variant, wisselende volgorde, iedere aanvraag een nieuw curl-proces en een nieuwe verbinding, daarna een statisch releasebestand als netwerkcontrole. Geen warmup, herhaalpogingen of weggefilterde uitschieters. Zelfde computer en netwerk; alle 48 HTML-antwoorden kwamen via AMS. Iedere ronde kreeg een nieuwe Worker-versie. Dit garandeert geen nieuw fysiek Cloudflare-isolate per aanvraag.

| Wachttijd tot eerste byte | Controle | Kandidaat |
|---|---:|---:|
| HTML-aanvragen | 24 | 24 |
| Mediaan | 1.872 ms | 355 ms |
| Hoogste waarneming | 5.450 ms | 773 ms |
| Meer dan 1 seconde | 19/24 | 0/24 |
| Meer dan 0,5 seconde | 19/24 | 7/24 |
| Eerste aanvraag per deployment, mediaan (n=3) | 1.798 ms | 604 ms |
| Eerste aanvraag per deployment, maximum | 2.179 ms | 773 ms |
| Statische netwerkcontrole, mediaan | 85 ms | 100 ms |
| Cachetreffers HTML | 5/24 | 24/24 |

De mediane paginawachttijd daalt **81,0%**. De meersecondenpieken zijn in deze afgebakende proef niet meer waargenomen; de resterende variatie is niet verdwenen. Alle drie eerste kandidaat-aanvragen blijven boven 0,5 seconde.

TLS/verbinding: mediaan 28,7 → 29,7 ms. De verbetering komt dus niet uit een snellere verbinding in deze proef. Gemeten Worker-CPU: mediaan 126,5 → 19,5 ms; Worker-walltime: 151,5 → 47,5 ms. Die runtimewaarden omvatten niet noodzakelijk alle wachttijd vóór het antwoord en zijn geen volledige ontleding van Cloudflare-internals.

Bewijs: `final-requests-round-1/2/3.json`, `final-summary.json`, `network-phases-summary.json`, `worker-timings.json`, `worker-timings-summary.json` en de deploymentlogs. Tailgegevens zijn beperkt tot eigen gemarkeerde aanvragen, timings en versie-ID; ruwe headers en IP-adressen zijn niet opgenomen.

## Controles

- Productiebouw, TypeScript en gerichte lintcontrole geslaagd.
- 23 gerichte unitcontroles geslaagd.
- 1.242 exacte inhoudsvergelijkingen en 9 lege-pakketcontroles geslaagd.
- 8 controles op parallel laden, 16 laad-/fout-/antwoord-/projectiecontroles en 4 handleidingflows geslaagd.
- 8 echte loader/navigatieflows: laatste beeld blijft staan; oefenomgeving en Docent openen; lokale en sessiegegevens behouden.
- 44 audiocontroles, geen fouten.
- 24 pixelgelijke schermparen, Chromium/WebKit, desktop/mobiel en licht/donker, vergeleken met de vooraf bewaarde cache-only kandidaat.
- Gebouwde serverbundel is kleiner; alle vier browserworkspaces blijven aanwezig; 20.105 openbare bestanden onveranderd.
- 64 echte stagingbezoeken geslaagd: Chromium en WebKit, 1280/390 px, Klink en +Docent, 2 herhalingen per combinatie, eerste bezoek plus echte reload. Geen browserfouten of horizontale overloop. Voor een vergelijkbare timing is verminderde beweging ingesteld; dit is geen meting van de normale loaderanimatie.
- Eerste browserbezoek (n=16 per variant): mediaan volledig geopend 3.059 → 1.863 ms; TTFB 1.279 → 149 ms. Reload (n=16): mediaan volledig geopend 1.230 → 1.049 ms; TTFB 33,6 → 36,5 ms. Alle 32 kandidaatbezoeken hebben TTFB < 1 seconde.
- **Open:** de langzaamste kandidaat-reload duurde nog 4.105 ms tot volledig geopend, terwijl de pagina al na 47 ms binnenkwam. De controle-reload had een maximum van 2.891 ms. Niet elke individuele volledige opening wordt dus sneller; browserwerk/latere downloads zijn niet hetzelfde als de onderzochte wachttijd vóór de pagina. Bij eerste bezoeken daalde het maximum van 8.313 naar 3.984 ms. Zie `browser.json` en `browser-summary.json`.
- 18 aanvullende stagingverzoeken geslaagd: voorbereide publieke HTML, bestaande handleidingroutes, 404, HEAD, RSC en queryvarianten, synthetische auth/cookie-invoer zonder reflectie en de twee vervallen opslag-API's met 410. Gegenereerde cachebestanden worden als buildoutput behandeld; de bronmedia blijven exact vergeleken.
- De bestaande volledige repo-lint heeft bekende eerdere bevindingen; hier is alleen geslaagde gerichte lint geclaimd.

## Isolatie, lopend werk en productiebehoud

Afgestemd met de bestaande chats ‘KLINK: IMPLEMENTEREN’ en ‘Zet Klink-chats online’. Alleen de eigen PR12-werkkopie gebruikt. Geen werk uit de actieve schrijf-/dicteerbranches meegenomen. PR8-staging en de lopende 50 dicteelessen blijven gereserveerd/HOLD volgens hun eigen dossier.

De Cloudflare-inventaris is vooraf gelezen. Beide nieuwe Workers hebben aantoonbaar uitsluitend `ASSETS` en een niet-geheime rondevariabele; geen D1-, KV-, service-, bucket- of secretbinding. Geen echte cursistgegevens en geen testaccounts ingevoerd. De SQL-migraties en authenticatie van Inzicht zijn niet geraakt.

Voor/na-deploymenthistorie is exact gelijk voor `taalroute-klink`, `taalroute-klink-inzicht` en `klink-inzicht-pr8-staging`. Klink-productie blijft source `dc37a479a7a6f148d61ffb5140dfd79112331f85`, Worker `886d4b64-a6bc-42bb-92f2-41ff7bb91dfb`; het live releasebestand is byte-inhoudelijk gelijk. Bewijs: `preservation-before/after.json`, `production-release-before/after.json`, `staging-settings-verified.json`.

GitHub Actions: geen workflows op de gecontroleerde main/PR12-bron, geen zware cloudtests of nieuwe workflows. Alle browser-, media- en inhoudscontroles lokaal uitgevoerd. Geen accountbudget of betaalinstelling veranderd.

## Grenzen en publicatie

Dit is een stagingresultaat, geen livewinstclaim. Niet onderzocht: een tweede fysiek netwerk, echte mobiele hardware, andere Cloudflare-regio's, langdurige belasting, accountgebonden MFA of databasehandelingen in de aparte Inzicht-app. Mobiel betekent hier een smalle browserviewport. De kleinere bundel houdt de inhoud van de browserapp intact; volledige downloads en het renderen van oefeningen kosten nog tijd.

Een volgende productiepublicatie vereist een nieuwe concrete opdracht, hercontrole van de dan actuele livebron/main en afstemming met parallel werk. De bestaande publicatiebeveiliging blijft behouden. Geen merge of productiepublicatie uitgevoerd.
