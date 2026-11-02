# Klink Inzicht — wisselende stagingvertraging, 2 november 2026

Status: nader afgebakend, **niet aantoonbaar opgelost**. Geen runtimewijziging, stagingdeployment, productiedeployment, SQL-migratie of inlogwrite uitgevoerd. Nico geeft voorwaardelijk publicatieakkoord nadat de wisselende vertraging is opgelost; die voorwaarde is nog niet vervuld. PR10 blijft draft. De afzonderlijke bestaande Inzicht-app wordt niet vervangen door PR8.

## Vastgestelde basis

PR8 lokaal en remote: ef71a3784e5b46671ca440911aa821d3683e044f; runtimebron afa33da93d5b9aa5745a21b643cc5da7735f7354. Bestaande versie bcaaafd9-07b9-475e-afe2-5cdd9217edfa is opnieuw via Wrangler gelezen. De coördinerende chat bevestigt dezelfde versie op 100%, deployment e9160852-88e8-4da9-ab70-dd90c93e14fb. EU-staging D1 blijft 95f1de18-0c61-46ca-b2af-5ee36543f67f. Schema 7 is eerder bewezen, deze beurt niet opnieuw via SQL gelezen. Geen andere chat werkt parallel aan deze reparatie.

## Wat de nieuwe proef werkelijk bewijst

- 24 losse, anonieme HTTP-metingen; daarna 15 en 18 aanvragen met hergebruik van één verbinding; vervolgens 8 anonieme API-controles. Geen cookies, wachtwoorden, OTP, schoolgegevens of POST-verzoeken.
- Exacte correlatie: /api/inzicht/me, CF-ray a544615a5ad2b438 (AMS),1.441873seconde clienttijd versus 3 ms CPU en 3 ms wall in Cloudflare Tail. Deze aanvraag zonder sessie stopt in de bron vóór een D1-query. De wachttijd van deze piek zit dus grotendeels buiten de gemeten handleruitvoering; dit is geen bewijs welke externe schakel verantwoordelijk is. Initialisatie, routering en transport zijn nog niet afzonderlijk bewezen.
- De direct volgende HTML-aanvraag, ray a54461635c6ab438: 52.781 ms client, 16 ms CPU/17 ms wall. Dit is een andere aanvraag, geen tweede trage accountaanvraag.
- Binnen de eerste behouden verbinding waren13 van 15 aanvragen44.6–160.5ms; twee accountaanvragen1.44/1.80seconde. Hergebruik helpt in deze steekproef maar verhelpt de pieken niet.
- Vier nieuwe losse accountaanvragen: staging 1.27–2.71seconde, bestaande productie 0.14–0.19seconde. Beide zonder sessie en zonder D1-query. Dit zijn verschillende apps/Workers/domeinen en daarom géén sluitend A/B-bewijs dat workers.dev de oorzaak is.
- Losse verbindingen bereikten onder meer AMS/WAW/MAN/GRU/SYD; ook statische bestanden varieerden. De gewone ingebouwde browser liet eveneens 1.51seconde HTML-wachttijd zien, gevolgd door 32 ms accountcontrole (AMS). De storing is dus niet uitsluitend in het losse meetscript gezien.
- Nieuwe browsercontrole: 16 bezoeken in Chromium/WebKit, desktop/mobiel, eerste en herhaalde bezoeken. Alle inlogschermen bereikbaar; nul JavaScriptfouten. Staging eerste bezoeken mediaan 6067 ms (1980–7837), herhaald 1020 ms (322–3064). Bestaande productie eerste 2388 ms (1909–4017), herhaald 875 ms (579–1997). Ook productie was tijdens deze kleine momentopname trager dan eerder. Dit is een aanvullende diagnose, géén gecontroleerde voor/na-snelheidswinst en geen fysieke telefoontest.

## Advies en publicatiegrens

1. Onderzoek eerst de Cloudflare-afhandeling vóór/buiten de handler met de bijgevoegde ray-ID's en tijdstippen. Een gerichte vervolgproef moet dezelfde stagingversie vergelijken via nieuwe en bestaande verbindingen en een tweede onafhankelijke internetverbinding. Een afzonderlijk stagingadres onder het eigen domein kan workers.dev als variabele toetsen, maar is nog niet ingericht en is geen bewezen oplossing. Behoud daarbij de bestaande herkomstcontrole, EU-D1, domeinisolatie en deploymentguard.
2. Verander MFA, tenantcontroles en observatiedata niet op grond van deze meting. Cache geen accounts/dossiers om de wachttijd te verbergen; verleng de timeout niet als snelheidsreparatie. De bestaande accountretry blijft intact.
3. Herhaal na een aantoonbare gerichte verbetering dezelfde eerste/herhaalde browserproef op mobiel/desktop, inclusief de volgende knop. Daarna gecontroleerde native login/MFA, herladen, retry en schoolisolatie. De verse accountbrede schrijfreservecontrole van de andere chat meldt 61058 geschreven rijen in 24 uur en blokkeert nog de zware online proef bij de interne 50000-reservegrens. Dit is geen vaststelling dat Cloudflare's volledige quotum op is. Geen omzeiling of betaalde uitbreiding.
4. Publiceer de Klink/+docent-snelheidsverbeteringen uit PR10 pas nadat Nico's stagingvoorwaarde is vervuld en na aansluiting op de dan actuele canonieke main/livebasis. Het aparte Inzicht-productieproject heeft afwijkende authenticatie, wachtwoordherstel en migraties; PR8 is geen veilige vervangende productiebuild. Bestaande integratie-/herstelvoorwaarden blijven gelden.

## Uitvoering en beperking

De bestaande browsermeettool is uitgebreid met alleen geschoonde response-/verbindings-/Server-Timinggegevens, zodat volgende metingen gekoppeld kunnen worden. De 16 bezoeken testen deze uitbreiding. Geen appcode of permanente logging gewijzigd; de korte gefilterde Tail-sessie is beëindigd. Alleen toegestane velden zijn opgenomen, geen volledige requestheaders of credentials. GitHub-workflows voor de push gecontroleerd: geen workflows; geen zware cloudtests.

Cloudflare's performance.now() kan geen volledige CPU-tijd meten: de klok loopt daar alleen op bij I/O. De bestaande Server-Timing-header stopt bovendien vóór volledig streamen van HTML. Daarom worden 0 ms-headers niet uitgelegd als 0 ms werk. Bronnen: https://developers.cloudflare.com/workers/runtime-apis/performance/ en https://developers.cloudflare.com/workers/observability/metrics-and-analytics/ .

Open: exacte oorzaak en bewezen reparatie; onafhankelijke tweede netwerkproef; nieuwe geauthenticeerde eindtest na voldoende reserve; productiecompatibele Inzicht-integratie. Niets hiervan is als afgerond of gepubliceerd gemeld.
