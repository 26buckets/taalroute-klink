# Klink — kleinere eerste download — uitsluitend staging, 5 november 2026

De opgeleverde proef is gecontroleerd op de livebasis en bijbehorende main-bewijsopvolger `a3beb7934eb43cb8d166c5e5a4fd0084f974fa6e` en livebron `ca2633c1da422cfd4e765e0e8c3713159ed29b49`. De goedgekeurde Help-/appel-en-peer-aanpassing én de 50 nieuwe dictees blijven behouden. **Deze snelheidswijziging is niet naar productie gepubliceerd of naar main gemerged.** Geen databasewijziging, dependency, workflow of budgetverhoging.

[Proefversie](https://klink-pr12-candidate.nico-554.workers.dev/#learner) · [Klink+Docent](https://klink-pr12-candidate.nico-554.workers.dev/#teacher/plus) · [Controle](https://klink-pr12-baseline.nico-554.workers.dev/#learner) · [Draft PR 12](https://github.com/26buckets/taalroute-klink/pull/12)

## Laatste meting op dezelfde livebasis

| Meting | Controle | Proefversie |
|---|---:|---:|
| Volledige eerste oefening, gezamenlijke mediaan | 8.72 s | 8.21 s |
| Desktop, vier bezoeken per variant | 9.08 s | 9.00 s |
| Mobiele schermmaat, vier bezoeken per variant | 8.07 s | 7.75 s |
| Laatste klik inclusief foto, mediaan | 1.07 s | 1.08 s |
| Totale overdracht inclusief headers, mediaan | 2,634,481 bytes | 2,519,134 bytes |
| Langzaamste volledige opening in deze steekproef | 9.51 s | 9.22 s |

Zestien verse Chromium-bezoeken, afwisselend in acht paren. Dezelfde oefening, dezelfde ontvangen en gedecodeerde foto, lettertypen gereed en twee beeldverversingen. 3 Mbps download, 1 Mbps upload, 40 ms extra latency, geen CPU-beperking en geen denkpauzes tussen klikken. Alle zestien native audio-opnamen speelden volledig af; geen browserfouten. **5 van acht paren sneller**; gepaarde mediane winst 0.35 seconde. De gezamenlijke mediaan daalde 5.9%. Op desktop is de mediane winst klein. Een herhaalbezoek aan de gewone oefening duurde in de aanvullende proef bij de kandidaat mediaan 0.87 seconde (n=2).

**De resterende acht seconden en netwerkpieken zijn niet opgelost.** De kleinere download is aantoonbaar; een hogere snelheid bij ieder bezoek is niet aangetoond. Dit is netwerkemulatie op een computer, geen fysieke telefoon of Nico's eigen netwerk. Alle bezoeken, inclusief tragere kandidaten, zijn bewaard. [Samenvatting](final/summary.json), [ruwe hoofdmeting](final/3mbps/visits.json), [24 koude/warme controles](final/cache-and-alfa/checks.json).

## Wijziging en afbeeldingen

Twee ongewijzigde Alfa C-audiozoeklijsten laden nu met de bestaande aanvullende spelers. Menu's en het lezen van opgeslagen voortgang trekken die metadata niet meer meteen binnen. De runtimewijziging raakt vijf bestanden: twaalf regels toegevoegd, elf verwijderd. Broninhoud, opnamen, afbeeldingen, antwoorden en opslagformaten blijven gelijk.

De vier gecomprimeerde startbestanden dalen samen van 1,808,352 naar 1,700,585 bytes: **107,767 bytes minder**. Geen nieuw bestand op het kritieke laadpad en geen extra netwerkronde. De gewone eerste oefening haalt geen aanvullende Alfa C-spelers op. De overige oefengegevens vormen nog steeds het grootste deel van de eerste download; extra fotocompressie lost die hoofdoorzaak niet op.

De foto's zijn al compact, voornamelijk WebP. De eerste oefenfoto is **31.162 bytes bij 640 × 640 pixels**. De foto's in de voorafgaande lijst zijn ongeveer **9–74 kB per stuk**. De desktoproute ontvangt circa 0,52–0,53 MB aan afbeeldingen/SVG's samen; de mobiele schermmaat circa 0,25–0,26 MB. Dezelfde oefenfoto wordt vanuit de lijst hergebruikt. Dit zijn kleine bestanden, geen garantie dat het netwerk ze zonder wachttijd levert. Er is geen kwaliteitsverlaging of nieuwe beeldbewerking uitgevoerd. [Inventaris](images.json).

Afweging: wie meteen Alfa C opent, ontvangt de verplaatste metadata alsnog. Door de andere compressie van de bestaande aanvullende spelers was die hele route in de controle circa 22 kB groter. Daar is geen algemene snelheidswinst aangetoond. De twee koude en twee warme bezoeken per variant/soort blijven in het bewijs staan; geen extra Worker-compressiepad toegevoegd.

## Serveraanroepen en kosten

De nieuwe importwijziging voegt **nul** serveraanroepen toe. De eerdere Brotli-proef handelt vier bestaande bestandsverzoeken met een Worker af. Dat zijn vier extra Worker-uitvoeringen ten opzichte van gewone statische afhandeling, geen vier extra downloads/verzoekrondes. Er wordt tijdens een verzoek niet opnieuw gecomprimeerd en er is geen database nodig.

In alle twaalf koude controles bereikten vier van die verzoeken de server. In alle twaalf herhaalbezoeken kwamen ze uit de browsercache: **nul nieuwe netwerkverzoeken voor deze vier bestanden**. De pagina zelf kan nog een verzoek doen. Harde verversing of lege/verlopen cache kan de vier verzoeken terugbrengen. [Cachebewijs](final/cache-and-alfa/validation.json).

Cloudflare rekent statische bestandsafhandeling niet als Worker-uitvoering; `run_worker_first` doet dat wel. Ook een Cloudflare-cachehit maakt zo'n uitvoering niet automatisch gratis. Workers Standard heeft onder meer 10 miljoen inbegrepen verzoeken en $0,30 per miljoen daarboven, plus eventuele CPU-/logkosten. Honderdduizend volledig nieuwe bezoeken betekenen vierhonderdduizend extra Worker-uitvoeringen: **$0,12 verzoekkosten als die allemaal boven de inbegrepen bundel vallen**, exclusief eventuele CPU/logkosten en abonnement. Dit is een rekenvoorbeeld, geen factuurprognose voor Nico.

De API meldt model `standard`; abonnementsgegevens geven 403. Resterende bundel en werkelijke rekening konden dus niet worden bevestigd. Budgetten zijn niet gewijzigd. De definitieve analyse registreert 92 uitvoeringen zonder fouten, CPU-mediaan 0,899 ms en p99 51,431 ms. Deze adaptieve dataset bevat ook HTML/protocolcontroles, kan achterlopen en is geen zuivere compressie-CPU- of facturatiemeting. [Serverbewijs](final/server-analytics.json), [accounttoegang en geverifieerde CPU-eenheid](account-cost-access.json).

Officiële bronnen, gecontroleerd 5 november 2026: [statische bestanden](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/) en [Workers-prijzen](https://developers.cloudflare.com/workers/platform/pricing/).

## Controles en actuele aansluiting

- Controle `5a7f92cb1608478792a89ec0c7819c96e8c766ed`; kandidaat `8de7543ba9012aac3728454ee2872ab37002895b`. Beide schone builds bevatten de live-inhoud. De latere main-opvolgers wijzigen uitsluitend bewijs/documentatie. [Herkomst](final/provenance.json), [teruggelezen releases](final/staging-releases.json).
- 56 pixelidentieke schermparen in Chromium en WebKit, desktop/mobiel en licht/donker. Alle CSS-declaraties en 20.000 assets behouden. [Algemeen](final/appearance/comparison.json), [spelers](final/player-appearance/comparison.json), [gebouwde bronnen](final/bundle-checks/checks.json). De PNG's staan volledig in de Drive-herstelkopie, niet opnieuw in Git.
- 203 volledige inhoudsvergelijkingen, twaalf gebouwde databankhashes, actuele build/TypeScript, acht Help-/appel-en-peer-proeven en alle 50 nieuwe dictees via de werkelijk gebouwde server exact vergeleken. [Nieuwe inhoud](final/dictation-and-audio-preservation.json), [Help](final/help/browser.json).
- De 288 Alfa C-audioproeven in beide browsers, negen bron-/audiounitproeven, opslagproeven en zestien herstel-/afgeschermde docentstromen zijn geslaagd op de Help-basis. De vijf veranderde runtimebestanden en Alfa C-audiobronnen zijn daarna exact gelijk gebleven; dat is na de dicteetoevoeging apart gecontroleerd. [288 audioproeven](reconciled/audio-browser/checks.json), [identiteitsbewijs](final/dictation-and-audio-preservation.json).
- Werkelijk aangeboden modules zijn na uitpakken exact gelijk aan de build; HEAD en 304 werken. De ongewijzigde oorspronkelijke afhandeling zonder Brotli is in de vorige ronde gecontroleerd. Vijf voorbereidingscontroles blokkeren productie en verkeerde host. [Definitieve HTTP-controle](final/http.json).
- Een oud volledig functioneel testschema verwacht de vervangen knoptekst ‘Uitleg’ en faalt ook op de controleversie. Dit oude scenario wordt niet als geslaagd opgevoerd; actuele audio-, scherm- en Help-bediening zijn afzonderlijk gecontroleerd.
- Tijdens het werk publiceerden de andere chats op afzonderlijk Nico-akkoord eerst Help/context en daarna 50 dictees. Beide zijn overgenomen; elke runtimewijziging leidde tot een nieuwe vergelijkbare proef. De laatste ronde behield productie Klink, productie Inzicht en PR8-staging exact: [uitrolcontrole](final/preservation-result.json). Deze taak heeft uitsluitend de twee PR12-testhosts uitgerold. Geen echte cursistgegevens of migraties.

Oudere meetronden blijven apart: bovenliggende bestanden 8,49 → 8,30 s; `reconciled/` met Help-basis 8,61 → 8,10 s. Alleen de laatste `final/`-ronde met alle 50 dictees is de huidige eindmeting. Geen percentages uit verschillende basissen opgeteld.

Open voor publicatie: afzonderlijk akkoord voor de concrete gecombineerde PR12-versie, normale publicatiecontroles op de dan actuele bron, daadwerkelijke accountkosten en een fysieke telefoonproef. De netwerkvariatie is niet verdwenen. Er is geen fysieke testtelefoon beschikbaar gesteld. De volledige herstelkopie en terugleescontrole staan in `drive-receipt.json`; de vorige herstelkopie staat in `pre-dictation-drive-receipt.json`.

## Nog lopende focusreparatie op main

De laatste controle zag nieuwere main `52ddc17c9ff473fd7151a12a433bb9c902f41718` met een afzonderlijke, nog niet gepubliceerde focusreparatie. Live gaf ook met een frisse controle nog `ca2633c1`. De integratie is in een aparte lokale branch geprobeerd; de verplichte voorbereidingscontrole blokkeerde de bouw op de bestaande 20.000-bestandsgrens. De eigenaar van die chat herstelt dit. Geen limiet verhoogd, blokkade omzeild of focusvariant uitgerold.

PR12 en de opgeleverde staging blijven bewust op de volledig geteste livebasis met alle 50 dictees. De in-progress integratie blijft afzonderlijk bewaard en overschrijft geen werk van de andere chat. Aansluiting op diens definitieve focusbron en de geïntegreerde controles zijn een open publicatievoorwaarde. Zie [inspectie en blokkade](pending-focus.json). De eindback-up bevat alle geteste broncode en bewijzen; deze nacontrole staat apart naast het archief.
