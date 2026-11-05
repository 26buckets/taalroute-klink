# Klink — resterende eerste opening — gecontroleerde staging, 5 november 2026

De laatste proef is volledig herhaald op actuele main `e8925763430601bea02fecfb89e91054e25015a7`, inclusief de afzonderlijk goedgekeurde Help-knop en appel-en-peer-correctie. Deze snelheidswijziging is **niet naar productie gepubliceerd**. Er is geen merge naar main, databasewijziging, nieuwe dependency, workflow of budgetverhoging uitgevoerd.

[Proefversie](https://klink-pr12-candidate.nico-554.workers.dev/#learner) · [Klink+Docent](https://klink-pr12-candidate.nico-554.workers.dev/#teacher/plus) · [Controleversie](https://klink-pr12-baseline.nico-554.workers.dev/#learner) · [Draft PR 12](https://github.com/26buckets/taalroute-klink/pull/12)

## Gemeten winst op de actuele basis

| Meting | Controle | Nieuwe proefversie |
|---|---:|---:|
| Volledige eerste oefening, gezamenlijke mediaan | 8.61 s | 8.10 s |
| Desktop, mediaan van vier bezoeken | 9.13 s | 8.94 s |
| Mobiele schermmaat, mediaan van vier bezoeken | 8.32 s | 7.82 s |
| Laatste klik inclusief foto, gezamenlijke mediaan | 1.08 s | 1.08 s |
| Werkelijk overgedragen bytes, mediaan | 2,631,762 | 2,522,287 |
| Langzaamste volledige opening in deze steekproef | 9.73 s | 9.27 s |

Zestien verse Chromium-bezoeken in acht afwisselende paren, vier paren per schermmaat (1280 en 390 px). Dezelfde oefening, dezelfde gedecodeerde foto, lettertypen gereed en twee beeldverversingen. 3 Mbps download, 1 Mbps upload en 40 ms extra latency; geen CPU-beperking of verzonnen denkpauzes tussen klikken. Alle zestien native audio-opnamen speelden volledig af. Zeven van de acht paren waren sneller. De gepaarde mediane winst was 0.51 seconde; de gezamenlijke mediaan daalde 6.0%. Dit is geen fysieke telefoonproef en geen statistische garantie voor ieder netwerk.

De acht seconden zijn dus **niet opgelost**. De startdownload is aantoonbaar kleiner; netwerkpieken blijven bestaan. In de aanvullende cachecontrole was de kandidaat bij één van de twee koude gewone bezoeken juist langzamer. Die bezoeken blijven in het bewijs staan. Een eerdere volledige ronde vóór de parallelle Help-publicatie gaf 8,49 → 8,30 seconde. De definitieve ronde hierboven gebruikt voor beide varianten de nieuwe goedgekeurde basis; de oudere meetronde staat apart in de bovenliggende map. Alleen resultaten uit dezelfde ronde worden vergeleken.

[Definitieve samenvatting](reconciled/summary.json) · [alle zestien metingen](reconciled/3mbps/visits.json) · [aanvullende 24 bezoeken](reconciled/cache-and-alfa/checks.json).

## Wat is veranderd

Twee ongewijzigde Alfa C-audiozoeklijsten worden door de bestaande aanvullende spelers geladen. Het menu en het lezen van opgeslagen voortgang trekken die lijsten niet meer meteen binnen. De runtimewijziging raakt vijf bestanden: twaalf regels toegevoegd, elf verwijderd. Alle brongegevens, audio-opnamen, afbeeldingen, antwoorden en opslagformaten blijven gelijk.

De vier gecomprimeerde startbestanden dalen samen van 1.808.218 naar 1.699.000 bytes: 109.218 bytes minder. Er is geen nieuw bestand op het kritieke laadpad en geen extra serververzoek toegevoegd. De gewone eerste oefening haalt de aanvullende spelers nog steeds niet op. Voor de grotere resterende winst moet het eerste pad minder van de overige oefengegevens nodig hebben; afbeeldingen opnieuw verkleinen pakt deze hoofdoorzaak niet aan.

Afweging: wie meteen Alfa C opent, ontvangt de verplaatste gegevens alsnog. Door de verschillende compressie van de bestaande aanvullende spelers was die hele route in de kleine controle ongeveer 17–18 kB groter. Er is daar geen algemene snelheidswinst aangetoond. De twee koude en twee warme bezoeken per variant en soort staan volledig in het bewijs. Een nieuw compressiepad of extra Worker-aanroep is hiervoor niet toegevoegd.

## Hoe groot zijn de afbeeldingen?

De gebruikte afbeeldingen zijn al gecomprimeerd, voornamelijk als WebP. De foto van de eerste oefening is **31.162 bytes, 640 × 640 pixels**. De foto's in de voorafgaande lijst zijn circa **9–74 kB per foto**. De desktoproute ontvangt ongeveer 0,52–0,53 MB aan afbeeldingen en SVG's samen; op de mobiele schermmaat ongeveer 0,25–0,26 MB. Dezelfde oefenfoto wordt uit de lijst hergebruikt.

‘Klein’ betekent niet dat een bestand zonder wachttijd binnenkomt. De gezamenlijke omvang en het netwerk tellen mee. De foto's zijn in deze wijziging niet opnieuw verkleind of in kwaliteit verlaagd. [Inventaris met afmetingen](images.json); de bronbestanden zijn identiek in de actuele proef.

## Serveraanroepen en kosten

De nieuwe importwijziging voegt **nul** serveraanroepen toe. De eerdere Brotli-proef handelt vier bestaande bestandsverzoeken met een Worker af. Dat zijn vier extra Worker-uitvoeringen ten opzichte van gewone statische afhandeling, maar geen vier extra downloads of nieuwe verzoekrondes. Er wordt tijdens een verzoek niet opnieuw gecomprimeerd en er is geen database nodig.

In alle twaalf koude bezoeken van de aanvullende proef bereikten vier van deze verzoeken de server. In alle twaalf herhaalbezoeken kwamen ze uit de browsercache: **nul nieuwe netwerkverzoeken voor deze vier bestanden**. De pagina zelf kan nog wel een serververzoek doen. De gewone oefening stond bij de twee herhaalbezoeken van de kandidaat in de mediaan in 0,92 seconde klaar. Een harde verversing of verlopen/lege browsercache kan de vier verzoeken opnieuw veroorzaken.

Volgens Cloudflare is statische bestandsafhandeling gratis; een met `run_worker_first` afgehandeld verzoek telt als Worker-uitvoering. Een Cloudflare-cachehit betekent niet automatisch dat die uitvoering gratis is. Bij Workers Standard geldt onder meer 10 miljoen inbegrepen verzoeken en $0,30 per miljoen daarboven, plus eventuele CPU- en logkosten. Honderdduizend volledig nieuwe bezoeken leveren vierhonderdduizend extra Worker-uitvoeringen op: **$0,12 aan verzoekkosten wanneer die allemaal boven de inbegrepen bundel vallen**, exclusief eventuele CPU/logkosten en abonnement. Dit is een rekenvoorbeeld, geen bevestiging van Nico's factuur of resterende bundel.

De API meldt accountmodel `standard`; toegang tot abonnementsgegevens wordt met 403 geweigerd. Daarom is geen claim van ‘gegarandeerd $0 extra’ gedaan. Budgetten en abonnementen zijn niet gewijzigd. In het definitieve meetvenster registreerde de beschikbare analyse 89 uitvoeringen zonder fouten; CPU-mediaan 0,885 ms en p99 76,811 ms. De beschikbare Worker-analyses en geverifieerde CPU-eenheden staan in [serverbewijs](reconciled/server-analytics.json) en [accounttoegang](account-cost-access.json). De dataset bevat ook HTML en protocolcontroles: geen zuivere meting van compressie-CPU en geen facturatiebestand.

Bronnen, gecontroleerd 5 november 2026: [Cloudflare static assets](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/) en [Workers-prijzen](https://developers.cloudflare.com/workers/platform/pricing/).

## Controle, aansluiting en grenzen

- Schone controlebuild `a7d519c8f114c3050b390d8c04879175e71c97d9`; schone kandidaatbuild `dad0fda4113378711f3c0e6d69098e650efe8899`. Beide bevatten actuele main. [Herkomst en stagingversies](reconciled/provenance.json), [teruggelezen releasegegevens](reconciled/staging-releases.json).
- 56 pixelidentieke schermparen in Chromium en WebKit, desktop/mobiel en licht/donker, inclusief de twee gewijzigde Alfa C-spelers. Alle CSS-declaraties en 20.000 assets behouden. Bewijzen: [algemeen](reconciled/appearance/comparison.json), [spelers](reconciled/player-appearance/comparison.json), [gebouwde bronnen](reconciled/bundle-checks/checks.json). De PNG's zijn onderdeel van de gecontroleerde Drive-herstelkopie.
- 288 hervatte Alfa C-opdrachten met juiste audiozoekkoppelingen in beide browsers; negen bron-/audiounitproeven; 203 volledige inhouds-/verzamelingsvergelijkingen; twaalf gebouwde databankhashes; TypeScript en gerichte lint geslaagd. [Audiobewijs](reconciled/audio-browser/checks.json).
- Acht actuele Help-/appel-en-peer-bedieningsproeven geslaagd. Ook de zestien herstel-/afgeschermde docentstromen en opslagproeven zijn opnieuw op deze actuele basis geslaagd. [Actuele Help-controle](reconciled/help/browser.json).
- Vier werkelijk aangeboden modules uitpakken naar precies de gebouwde bestanden; HEAD, 304 en oorspronkelijke afhandeling zonder Brotli werken. Vijf voorbereidingscontroles blokkeren productie en verkeerd gekozen testhost. [HTTP-bewijs](reconciled/http.json).
- Een oud functioneel testschema zoekt de inmiddels vervangen knoptekst ‘Uitleg’ en faalt daarmee ook op de controleversie. De actuele audiobediening is afzonderlijk volledig gecontroleerd; dit oude volledige scenario is niet als geslaagd opgevoerd.
- De andere chat publiceerde tijdens de eerste ronde de afzonderlijk goedgekeurde Help-/contextaanpassing, livebron `43c05c9d4c40adb5373d564e6131d5dbdd90d546`. Deze taak heeft geen productiepublicatie uitgevoerd. De proef is daarna opnieuw opgebouwd en gecontroleerd. Gedurende die definitieve ronde bleven productie Klink, productie Inzicht en PR8-staging exact gelijk: [uitrolcontrole](reconciled/preservation-result.json). Geen echt cursistgegeven gebruikt, geen migratie uitgevoerd.

Voor publicatie blijven een afzonderlijk akkoord voor de concrete gecombineerde PR12-versie, de normale publicatiecontroles op de dan actuele bron en verificatie van de daadwerkelijke accountkosten nodig. Een fysieke telefoonproef is niet uitgevoerd; er is geen fysieke testtelefoon beschikbaar gesteld. De resterende netwerkwisseling is niet verdwenen. De herstelkopie en uploadcontrole worden vastgelegd in `drive-receipt.json`.
