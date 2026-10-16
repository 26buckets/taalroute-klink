# Klink — beeldbatch en menselijke mediabeoordeling

## Status

Nico heeft aangegeven de media zelf te beoordelen. Dat is een keuze van beoordelaar, geen inhoudelijke goedkeuring. De werkversie blijft dezelfde Klink-app; routes, menu, vormgeving en de geluidsinhoud van de opnamen zijn niet gewijzigd. De ingebedde merkvelden van 346 WAV-bestanden zijn wel aangevuld. Er is niet gepubliceerd en `main` is niet bijgewerkt.

De aanvulling bestaat uit zestien woordfoto's. De exacte betekenis, koppeling, generatiegegevens en aandachtspunten staan in `klink-beeldbatch-20261016.json`. In de mediadata staan ze als kandidaat met beoordeling open. Het eerste zoutbeeld is afgewezen vanwege verwarring met suiker; dat origineel blijft uitsluitend als herstelbewijs bewaard.

Actueel: 338 gekoppelde woordopnamen, 177 woordbeelden, 17 instructieopnamen en 12 opnamen bij zinnen/situaties. Er ontbreken nog 161 woordbeelden. Ook functiewoorden staan daarbij: een willekeurige voorwerpfoto is daarvoor geen oplossing. Geen nieuwe losse /t/ geproduceerd of aangesloten.

## Beoordeling door Nico

Open `outputs/media-review-20261016/index.html`. Dit is een lokaal redactiehulpmiddel, geen tweede cursistapp en geen publicatie.

Begin met Nieuwe beelden (16), Nieuwe woordaudio (7), Instructies (17) en Zinnen en situaties (12): samen 52 onderdelen. Bestaande beelden (161) en bestaande woordaudio (331) zijn afzonderlijk beschikbaar. Dit zijn 544 mediabeslissingen, niet 544 woorden.

De beoordeling bevat het daadwerkelijke leveringsbestand, betekenis of transcript en aandachtspunten. Een foto en de uitspraak krijgen afzonderlijke beslissingen. Audio kan pas als goed worden gemarkeerd nadat de speler het einde heeft bereikt; een niet geladen beeld kan niet worden goedgekeurd. Dit bewijst technisch afspelen, niet dat iemand werkelijk heeft geluisterd of dat de uitspraak juist is.

Goed/Aanpassen bewaart een keuze met beoordelaar, tijdstip en volledige bestandscontrolewaarde. Aanpassen vraagt een opmerking. Wijziging van het bestand maakt een eerdere keuze ongeldig. Download mijn beoordeling levert een JSON-bestand om terug te sturen; dit geeft nooit automatisch publicatiegoedkeuring. De lokale browserbewaring is gemak, geen back-up: download het oordeel voor overdracht.

## Beeldcontrole

De bestaande Klink-woordfotostijl is behouden. Het B1-examenillustratiecontract is niet van toepassing op deze bestaande foto-app. Het contactblad vergelijkt de hele nieuwe reeks zonder afsnijden of uitrekken; de originelen zijn afzonderlijk bekeken. De algemene betekenis-, object- en tekstcontroles zijn wel toegepast.

- `TR21-OBJECT-01` — Exact counts, states, object relations, mechanics, anatomy, hands, gaze, and contact points must be correct and spatially plausible. Geen personen of handen in deze reeks; noodzakelijke verbindingen en draagvlakken gecontroleerd.
- `TR21-TEKST-01` — Required labels must be exact, correctly spelled, readable, oriented and placed; no pseudoletters, unintended English, stray digits, brands, or logos. Geen labels, merknamen of QR-codes nodig of opgenomen.
- `TR21-KANDIDAAT-01` — The image must be quickly and unambiguously readable at exam size and must not leak decisive information from the wrong modality. Herkenbaarheid blijft expliciet ter beoordeling, vooral bij bord, pak, kous, zout, saus en sap. Een foto alleen bewijst bij zout niet de inhoud van het vaatje; categorievoorbeelden zijn geen volledige betekenisdefinitie.
- `TR21-VRIJGAVE-01` — Machine/maker QA is preflight only; independent human approval is mandatory; upload/release requires separate explicit instruction. De technische tests geven geen menselijke goedkeuring.

Deze reeks: VOORWAARDELIJK DOOR NAAR ONAFHANKELIJKE MENSELIJKE BEELDGOEDKEURING. Dat geldt niet als vrijgave van de volledige app.

## Lokale controles

- De 24 curriculumtests, vier publicatiebewijstests en volledige bestaande browserreeks slagen na de beeldkoppelingen.
- De nieuwe beoordelingstest controleert alle 544 bestandscontrolewaarden, een vereiste beoordelaarsnaam, geladen beelden, audio-einde, herstelopmerking, herladen, export en ongeldig geworden oordelen.
- Alle zestien nieuwe beelden zijn in de bestaande Klink-player geopend op hun eigen betekenis-ID; verhouding blijft behouden met `object-fit: contain`.
- Het beoordelingsscherm is op 1280, 390 en 320 pixels gecontroleerd. Automatische testkeuzes zijn geen menselijke beoordelingen en worden niet aan Nico overgedragen.
- TypeScript, gerichte lintcontrole en productiebuild slagen. Bestaande bundel-/frameworkwaarschuwingen zijn niet als onderdeel van deze mediaronde opgelost.
- De extra controle vond dat de WAV-export de ingestelde albumartiest niet had bewaard. In 346 WAV-bestanden zijn albumartiest en uitgever daarom als ingebedde ID3-velden aangevuld. De oorspronkelijke geluidsbytes en onafhankelijk gedecodeerde geluidscontrolewaarden zijn voor ieder bestand gelijk gebleven; niets is opnieuw gegenereerd of gehercodeerd. De eerdere bestanden blijven afzonderlijk als herstelback-up bewaard. Alle gekoppelde audio wordt nu gecontroleerd op artiest, albumartiest, uitgever en passend Taalroute-album. De herstelcode heeft twee eigen tests voor bytebehoud en het afwijzen van ongeldige/dubbele metadata.
- De publicatiecontrole blokkeert terecht op ontbrekende beelden, open beoordelingen en de werkbranch. Geen vlag, poort of publicatiebeveiliging omzeild.

Bewijs: `outputs/media-review-20261016/browser-check.json`, `image-evidence.json`, `audio-metadata-evidence.json`, de schermbeelden, en `outputs/media-connection/media-check.json`. De bron- en mediaback-up bevat de originelen, de audio vóór metadataherstel, het afgewezen beeld en de volledige beoordeling. Oudere opnameherkomst en herstelbestanden blijven beschikbaar in de eerder gecontroleerde projectback-up.

## Volgende verwerking

Neem Nico's geëxporteerde beoordeling uitsluitend over als de volledige bestandscontrolewaarde nog overeenkomt. Herstel afgekeurde onderdelen gericht; keur ontbrekende of gewijzigde bestanden niet stilzwijgend goed. Werk daarna de ontbrekende betekenisbeelden/context uit. Pas bij volledige inhoudelijke vrijgave opnieuw de actuele liveversie, bronafstamming, canonieke branch, alle mediabestanden en publicatievoorwaarden controleren; alleen daarna de gewone publicatieroute gebruiken.
