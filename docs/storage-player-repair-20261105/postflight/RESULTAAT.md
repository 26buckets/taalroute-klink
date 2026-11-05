Klink — gepubliceerde herstelversie — 5 november 2026

Live: https://klink.taalroute.nl
Bron: 487be7bb68af6d883b479d00096a79d12ac42791 (schone canonieke main)
Worker: b3e6b0f6-c83c-4ab9-b7fa-92bf5f3f0b49
Publicatie: 5 november 2026, 08:46 Nederlandse tijd, via npm run deploy.

De actuele livebasis 93d69b044b5e3a5bf177c88cb0cfd2fe0bb03402 en GitHub-basis fc51e7c5501f5bf410ee96e569e3676b51d65568 zijn vóór publicatie opnieuw bevestigd. De herstelversie stamt hiervan af. De applicatiecode is bytegelijk aan de eerder volledig gecontroleerde kandidaat b5bdcc76707ff1f8ba1e1846d9b0005c8735452d. Alleen het concrete eigenaarsakkoord, de opvolgende publicatiecontrole en haar tests/bewijs zijn toegevoegd. De gewone publicatiepoort is intact en geslaagd op schone main, ook binnen npm run deploy.

Gepubliceerd herstel
- Schrijfgeschiedenis blijft behouden bij gelijktijdig gebruik in tabbladen; concepten overschrijven geen nagekeken antwoorden.
- Rondevoortgang blijft behouden wanneer het aantal oefeningen verandert; verwijderde oefen-ID’s tellen niet mee.
- Gerichte opsplitsing van opslag- en schermgedrag in de oefenspeler, zonder nieuw uiterlijk of inhoud.
- Het werkblad kan weer ver genoeg scrollen om de bestaande Klaar-knop te bereiken.
- Tien bestaande WAV-bestanden kregen verliesloos ontbrekende Taalroute-merkvelden. De opname is niet hercodeerd of opnieuw gemaakt.

Controles
De eerdere volledige lokale controle blijft geldig: 47 pakketopdrachten, 71 gerichte functionele unitproeven, alle 1.800 productiecollecties, 13.891 losse audiobestanden en 6.293 fragmenten in 72 bundels. Broninhoud en media zijn behouden. De oorspronkelijke 50 publicatiebeschermingsproeven zijn vastgelegd; aanvullend slagen de nieuwe vrijgave met twaalf negatieve mutaties, de leesvrijgave met acht negatieve mutaties en beide leeseenheidstests. Een controle vóór commit wees de nog niet vastgelegde nieuwe scripts terecht af; op schone main is de gewone volledige controle groen.

Op het werkelijke domein na publicatie:
- 6 opslagproeven en 12 schrijfproeven in Chromium en WebKit, inclusief herladen, oude antwoorden, concepten, geblokkeerde opslag en gelijktijdige tabbladen.
- 80 lees-/woordaudiostromen, 160 afgewezen afleiders en 8 rondes met gedeeltelijke en volledige voortgang na herladen.
- 40 spreekstromen, 4 rondes na herladen en 2 opnameproeven met synthetische microfoon; native audio gebruikt.
- 80 schermvergelijkingen na publicatie zonder betekenisvolle pixelverschillen en met gelijke tekst/geometrie; daarnaast vóór publicatie 80 vergelijkingen met de toenmalige live-app. Desktop/mobiel, licht/donker, Chromium/WebKit; alleen maximaal twee kleureenheden rasterafronding toegestaan.
- 8.134 bestanden uit het bestaande live-mediaregister exact teruggelezen; 72 API-bestanden exact, inclusief HEAD en bytebereik.
- 401 bestaande woordopnamen gecontroleerd op aangeboden bytes, ingebedde Taalroute-metadata en volledige decode. De 10 gewijzigde WAV-bestanden apart live teruggelezen: juiste merkvelden en exact de oorspronkelijke gedecodeerde geluidsdata.
- Twee nieuwe en twee behouden oefenbanken exact; alle zes ingetrokken dicteebanken blijven 404.
- Werkelijk 31 bestanden geüpload en 19.969 behouden: 20.000 aangeboden bestanden. Worker gzip 6.136,71 KiB; geen limietverhoging.

Geen inhoud, routes, database, budget, workflow of vormgevingsreferentie gewijzigd. De repository bevat geen GitHub Actions-workflows; de uitgebreide controles zijn lokaal uitgevoerd. Bestaande opslagcodes en gebruikersgegevens blijven behouden; geen databasebewerking.

Bron- en herstelback-up vóór publicatie: Drive 1oHFvG2zkbxs7lmyhqCys3y-1Oc6FC_hE, 45.338.058 bytes, SHA-256 22d152c883937c0796ff6da0bd76ec8023d24c10dc5ae81d10a6888fdeb4c692, volledig teruggelezen met archief- en manifestcontrole. Deze bevat ook de eerdere volledige code-/bewijsback-up en de originele tien opnamen. De definitieve bewijsback-up bevat daarnaast de gepubliceerde Git-bron, de livecontrole en schermvergelijkingen; het ontvangstbewijs wordt naast dit rapport bewaard.

Beperkingen: geen proef op fysieke telefoons, menselijke beluistering of cursistenpilot geclaimd. Schermtests gebruiken echte browserengines op gesimuleerde schermmaten; opnameproeven gebruiken een synthetische microfoon. De bewijsopvolger op main verandert alleen documentatie en moet niet opnieuw worden gepubliceerd.
