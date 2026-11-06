# Klink en Klink+docent — compacte oefenfooter, 7 november 2026

Online op klink.taalroute.nl. Bron 9f928feae98456b654a52c3930384801900810eb (schone canonieke main), Worker 3fb34baf-2b7c-4519-b432-f8c4070bb9f8 (100%). Uitgerold via npm run deploy als opvolger van de gecontroleerde productiebron 8d73a0bda6ba3d13344f319e6863f6f74acb69c3.

De zeven aangepaste CSS-bestanden zijn exact gelijk aan de goedgekeurde preview. Het onderste appmenu bleef ongewijzigd; geen vaste plaatsing van de oefenfooter toegevoegd. PR 12, de hostingconfiguratie, Inzicht en staging zijn niet gewijzigd.

Lokaal: 36 schermproeven, 12 gerichte bedieningsproeven, normale publicatiepoort en build. Live: 36 schermproeven in Chromium/WebKit op 1366, 390 en 320 px, licht en donker. Op mobiel is Start aangeklikt; Verder en de volgende stap in Klink+docent zijn op beide schermtypes doorlopen. Lange feedback past, Verder behoudt aanraakruimte. In 12 live voor/na-vergelijkingen bleef het menu op dezelfde plek; Klink heeft 4 px minder footerhoogte en de docentbalk 8 px. Een eerste voormeting van mobiel lettertypen miste de desktoptoets; de mobiele Controleer-knop is vervolgens voor en na succesvol gebruikt.

De live bronmarkering, 7 CSS-bestanden, 9 woorddicteebanken met samen 50 vragen en 50 opnamen zijn exact teruggelezen. De bestaande inhoudsvingerafdrukken en de Cloudflare-configuratie zijn ongewijzigd. De 302 lessen passeerden de bestaande behoudtest. Werkelijk 23 nieuwe + 18.370 behouden assets, 18.393 totaal. Geen workflows of betaalde upgrade gestart. Geen fysieke telefoonproef.
