# Klink Inzicht: menutoegang en bestaand domein

## Gerichte opdracht — Nico, 1 november 2026

Nico mist Inzicht naast Docentenhandleiding, Kleurstand, Klink+docent en Delen en vraagt de menulink toe te voegen. Vervolgens noemt hij inzicht.taalroute.nl als vast adres en geeft toestemming het via Cloudflare aan te maken/bouwen. Dit is een gericht uiterlijkakkoord voor één extra menuoptie; geen herontwerp of toestemming voor het samenvoegen van databases, het vervangen van een bestaande app, een merge of publicatie van de volledige Klink-app.

De gedeelde header krijgt één native link **Klink Inzicht**, direct na Klink+docent en vóór Delen, met het bestaande menu-opmaakpatroon en een decoratief Lucide-lijnicoon. De bestemming is `https://inzicht.taalroute.nl/`, zonder persoonsgegevens, klasnummer, sessie of toegangstoken in de URL. De bestaande menuopties en het verborgen menu tijdens projectie blijven behouden. CSS, logo en de oorspronkelijke vormgevingsvloer veranderen niet. De header was vóór deze wijziging bytegelijk aan de gecontroleerde canonieke main `debea185f077db2283d8113e28b370f4b107d7fb`.

## Het domein bestaat al; geen tweede app aangemaakt

Read-only gecontroleerd op 1 november 2026: de root geeft HTTP 200 en titel **Klink Inzicht · Taalroute**. Het publiek aangeboden `/release.json` noemt broncommit `a6a64445041a0ae8ca5fd5f50d73c6cb2b16e61f`, bouwtijd `2026-11-01T03:03:33.410Z`, database `taalroute-klink-inzicht` en schoollidmaatschappen/toegewezen groepen als accountmodel. Dit is de reeds bestaande afzonderlijke app beschreven in ONLINE-STAGING.md, niet de PR8-staging en niet de nieuwe drie rapportages. Zonder sessie vraagt `/api/me` om inloggen. Deze publieke metagegevens bewijzen niet de actuele administratieve Worker-/D1-koppeling of een volledige geauthenticeerde controle.

Cloudflare-administratieve read-only verzoeken voor accounts/zones zijn met de opgeslagen sessie afgewezen (HTTP 403). Geen andere identiteit gebruikt of toegangsbeperking omzeild. Geen DNS-record, Worker, database, account, betaalinstelling of publicatie gewijzigd. Er hoeft geen nieuw domein of nieuwe database te worden gemaakt.

De nieuwe rapportages in draft PR #8 en migraties 0006/0007 zijn hiermee **niet online gezet**. Het vaste adres blijft de bestaande versie tonen. Samenvoeging of vervanging vereist eerst bron-/account-/datavergelijking en behoud van bestaande gegevens; deze menuopdracht voert dat niet uit. De oorspronkelijke productie-/mergegrens blijft van kracht.

## Controle en afstemming

De gerichte menucontrole en bewijsbeelden staan in `evidence/menu-domain/`. De test rendert het echte gewijzigde headercomponent met de bestaande menu-, kleurstand- en stijlbestanden. De ongewijzigde Next Image/Link-wrappers worden in deze geïsoleerde componentproef vervangen door native elementen; dit is geen volledige applicatie- of ingelogde MFA-regressie. Een gewone lokale appstart kon in deze sessie niet betrouwbaar worden herhaald door onderbroken/lege reads van bestaande lokale afhankelijkheden. De eerdere 90 tests en volledige browserresultaten in `evidence/visual/release.json` blijven historisch bewijs voor hun genoemde broncommit, niet voor een nieuwe integrale proef.

De stagingproefchat test de menutoegang mee bij haar gezamenlijke vervolgproef. Zij blijft eigenaar van de eindbijwerking van PROJECTVERSLAG.md en het bestaande Drive-hoofdverslag `1wniVsuiXbsy1wuGHPTxiiGQXd4U_jwNk`; dit document is uitsluitend een bewijsbijlage. Geen parallel overschrijven van het hoofdverslag. De wijziging komt bovenop gezamenlijke PR-head `5083bce5a6e39440575dd4a29463ffd71132cfd9`. Zware controles blijven lokaal; vóór push opnieuw controleren dat geen Actions-workflow wordt gestart.

Geslaagd: twaalf gerichte vergelijkingen (Chromium en WebKit × 320/390/1440 pixels × licht/donker), gelijke geometrie van bestaande kopbediening, behoud van de bestaande menuopties, één zichtbare Inzicht-link met aanraakdoel ≥44 pixels, toetsenbordfocus/Escape en behoud van het classroom-hidden-attribuut. In beide browsers is de echte link aangeklikt en het bestaande wachtwoord-inlogscherm bereikt. Er is niet ingelogd en geen data geschreven. Gerichte syntactische/regel-lint slaagt; type-aware lint en volledige appbouw zijn in deze aanvullende controle niet opnieuw uitgevoerd. Desktop licht en mobiel donker zijn visueel beoordeeld.
