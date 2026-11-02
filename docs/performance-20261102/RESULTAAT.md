# Klink — snelheidsproef, 2 november 2026

Status: gebouwd en lokaal getest in een afzonderlijke reviewbranch. Geen productiepublicatie, merge, domeinwijziging, cloudmigratie of wijziging van Inzicht PR8. De zelfstandige Inzicht-app is behouden.

## Gemeten resultaat

De vergelijkbare snelheidsmeting gebruikt één vastgezette inhoudsbasis: main `eb8c54c5ee1c5fb60cfa629f5bd0eda231669ec9`, inclusief de nieuwe luisterrondes. De kandidaat bevat daarop de performancewijzigingen tot `e3a92daa`. Per rij 24 metingen: Chromium en WebKit, 1280/390px, eerste en herhaald browserbezoek, drie herhalingen. Lokale productiebuild, geen vertraagde processor/netwerk en geen fysieke telefoon. Het zijn medianen, geen garantie voor iedere internetverbinding.

| Onderdeel | Voor | Na | Eerstvolgende handeling voor → na |
|---|---:|---:|---:|
| Klink-beginscherm | 2,334 s | 0,122 s | Oefenen openen: 1,974 → 1,734 s |
| Klink-oefenomgeving | 3,696 s | 2,128 s | Woorden bekijken: 0,086 → 0,083 s |
| Klink+docent | 2,497 s | 0,946 s | Les openen: 0,037 → 0,043 s |

De vaste wachttijd is verwijderd. Het bestaande laadscherm wacht nog wel op herstel van de veilige lesweergave en de gekozen appcode. Cursist en docent laden afzonderlijk. De eerste oefenomgeving blijft relatief zwaar; de losse opstartpauze is niet verplaatst naar de volgende knop. Verschillen van enkele milliseconden bij vervolghandelingen vallen binnen de meetvariatie.

Bij drie afspeelacties uit dezelfde audiobundel daalt de opgehaalde hoeveelheid van 6.266.631 naar 2.088.877 bytes: één download in plaats van drie. Dit is in twaalf sessies per versie gecontroleerd, in beide browsers en schermmaten, met daadwerkelijke native afspeelstart. Het testmodel reproduceert de eerder geverifieerde HTTP200-terugval met dezelfde originele audiobytes en 100ms vaste antwoordvertraging; dit is geen gemeten mobiel internetprofiel. De eerste download blijft circa 2,1 MB. Geluiden en metadata zijn niet gewijzigd of opnieuw gecodeerd.

De cache bewaart maximaal 8 MiB complete, publiek toegankelijke, van een hash voorziene audiobundels. Exacte bereik-/lengte-/ID3-controles blijven actief; gedeeltelijke antwoorden worden niet als complete bundels bewaard. Annulering, opnamebescherming, maximale bestandsgrootte, verlopen afspeelacties, gelijktijdige downloads en herstel na beschadigde gegevens zijn gecontroleerd. Geen privégegevens of API-antwoorden worden gecachet.

## Inzicht apart gehouden

PR8 bleef op `ef71a3784e5b46671ca440911aa821d3683e044f`; de laatste bekende online runtime is `afa33da93d5b9aa5745a21b643cc5da7735f7354`. De lokale matrixnulmeting op deze PR8-basis telt 24 bezoeken met twee fictieve scholen en twaalf cursisten per school. Mediaan circa 0,806 s, vervolg naar onderliggend bewijs circa 0,099 s. Aanmelding/MFA en internetvertraging zijn hierin niet inbegrepen. Dit is ook niet de eerdere online proef met 3.000 TRAIN-events.

Daarnaast zijn 48 uitsluitend anonieme online bezoeken uitgevoerd, zonder wachtwoorden, formulierinzendingen, MFA, dossiers of cloudgegevenswijzigingen. De actuele zelfstandige app op `https://inzicht.taalroute.nl/` (bron `629d1f243ee25ce227ff508bd87d138bf09487b7`) had medianen 0,730 s bij eerste en 0,521 s bij herhaald bezoek. De bestaande PR8-proefomgeving had 2,812 s respectievelijk 0,355 s. Eerste stagingbezoeken varieerden van 0,334 tot 5,452 s. Een verse browsercache bewijst geen koude Cloudflare Worker.

Een aanvullende read-only diagnose (16 bezoeken) zag bij drie van de vier eerste stagingbezoeken 1,4–2,1 seconden wachten op de eerste HTML-bytes; bij het vierde kostte het anonieme accountantwoord circa 1,8 seconde. Dit lokaliseert de wachttijd in die verzoeken, maar scheidt serververwerking en netwerkvertraging nog niet.

Dit toont dat de wisselende vertraging ook vóór MFA kan optreden. Het bewijst nog niet welke netwerk-/serverstap de oorzaak is. Authenticatie, MFA, tenantisolatie, EU-D1, bestaande observatiebetekenissen en rapportages zijn niet gewijzigd. De bestaande staging is geen online publicatie van deze nieuwe Klink-performancebranch.

## Controle en behoud

- Iedere inhoudelijke stap kreeg dezelfde meting opnieuw: oorspronkelijke nulmeting, alleen wachttijd, alleen aanvullend apart laden, daarna audiocache. Na de nieuwe main-inhoud is nogmaals een passende nulmeting en eindmeting gedaan.
- 44 gerichte bron-, route-, audio-, cache-, annulerings-, voortgangs- en modulehersteltests; typen, gerichte lint en productiebuild geslaagd.
- 16 browsercontroles voor traag geladen code, kapotte decoratieve afbeelding, veilige projectieweergave, verkeerd adres/herladen en behoud van de eigen geschreven zin.
- 44 bestaande woordbedienings-/opname-/toetsenbord-/antwoord-/annuleringscontroles in Chromium/WebKit geslaagd. De twee benodigde model-/markeerfixtures zijn rechtstreeks uit de bron geselecteerd.
- De oorspronkelijke én de vergelijking op de gemeten inhoudsbasis gaven elk 24 pixelgelijke schermparen: desktop/mobiel, licht/donker, Start/oefenomgeving/Klink+docent. De vergelijking op de gemeten main-basis staat in `appearance/comparison.json`; alleen nul afwijkende pixels geldt als geslaagd.
- Geen wijzigingen in inhoud, originele media, vormgevingsbestanden, routes, opgeslagen voortgang of authenticatie. De nieuwe luisterbundelondersteuning uit main is expliciet behouden tijdens de rebase.
- Geen GitHub Actions-workflows aanwezig/toegevoegd of zware cloudtests gestart. Alle bouw- en browsercontroles lokaal.

## Laatste aansluiting op parallel contentwerk

Tijdens het afronden is ook de volgende zinnenbatch gepubliceerd (live `5d2c8f0b37aa5562bdbdd99ae7aea34f552bbdf3`, main `f2e4b754e636fa9bab8ef7c316d0e4e515dd53ce`). De reviewbranch is daarop gerebased; de gemeten cijfervergelijking hierboven blijft eerlijk gekoppeld aan de vaste eb8-inhoudsbasis. De nieuwe inhoud wordt niet teruggedraaid. De laatste build, typen, 44 gerichte tests, 16 laad-/behoudproeven en 44 woordbedieningsproeven slagen op deze aansluiting. De audiotest behoudt bewust de oorspronkelijke leesbewijstaak; nieuwe luister-eerst-zinnen vergrendelen antwoorden terecht tot na beluisteren.

## Open en nodig voor publicatie

1. Afzonderlijk expliciet publicatieakkoord voor deze concrete performanceversie, gevolgd door de normale volledige publicatiepoort en livebasiscontrole. Er is nog niets uitgerold.
2. De bestaande historische twee-secondenvrijgave blijft bewaard. Een opvolgende publicatieregistratie moet deze nieuwe opdracht brongebonden vastleggen; oude bewijzen of publicatiebeveiligingen niet overschrijven of omzeilen.
3. De gedeelde oefen-/lesgegevens blijven omvangrijk. Verder uitsplitsen vraagt opnieuw een afzonderlijke, meetbare wijziging; geen grotere gegevensherstructurering in deze proef.
4. De eerste complete audiobundel blijft groot. Correcte gedeeltelijke levering of anders indelen kan later de eerste afspeelactie verbeteren; geen extra bestandenexplosie of betaald abonnement ingevoerd.
5. Voor Inzicht blijven online matrix-/MFA-metingen op een toegestaan moment nodig. Er zijn in deze ronde geen nieuwe ingelogde cloudbelastingproeven of cloudschrijfacties uitgevoerd; de eerdere accountbrede schrijfguard is niet omzeild. De bestaande afzonderlijke productie-app en PR8 hebben nog verschillende account-/migratiecontracten.
6. De ongewijzigde volledige historische leerdoelinventaris faalt op `Missing KGR-AB-ZOE-001`. Dit is aan de contenteigenaar gemeld. De gerichte audiofixtures vervangen geen volledige leerdoelreview. Fysieke telefoon, traag mobiel netwerk en nieuwe menselijke uitspraakreview zijn niet uitgevoerd.

## Bewijzen en herhalen

`summary.json` bevat de samenvatting. De gecomprimeerde meetbestanden bewaren alle afzonderlijke tijden en bronmanifesten; de Drive-herstelkopie bevat ook oorspronkelijke JSON, alle schermparen, tests, bronpatch en integriteitsmanifest. Geen testwachtwoorden, sessietokens, MFA-sleutels, D1-kopieën of toolcredentials in Git of het pakket.

Gebruik de bestaande dependencies en `npm run build`. `scripts/serve-performance.mjs` start uitsluitend een lokale Cloudflare-runtime op 127.0.0.1:19120, zonder externe database. `KLINK_PERF_BUILD_ROOT` en `KLINK_PERF_PORT` selecteren een tweede lokale referentiebouw. `scripts/measure-performance.mjs`, `measure-word-audio.mjs`, `test-performance-browser.mjs` en `compare-performance-appearance.mjs` voeren de beschreven proeven uit. De vergelijking gebruikt poort19122 voor de nulmeting en19120 voor de kandidaat.

Voor de afzonderlijke PR8-nulmeting: bouw de exacte PR8-checkout lokaal, stel `KLINK_INZICHT_SOURCE` op die checkout in en start `scripts/serve-inzicht-performance.mjs`. Dat maakt alleen een tijdelijke synthetische lokale database en een genegeerd lokaal sessiebestand. `measure-inzicht-performance.mjs` meet daarna de matrix. `measure-inzicht-login.mjs` bezoekt uitsluitend beide openbare aanmeldschermen; het logt nergens in.
