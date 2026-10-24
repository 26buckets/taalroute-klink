# Actuele Klink-publicatie

Live: https://klink.taalroute.nl

Broncommit: `ae860b9c36271539a97d3205b9663e31dda187d7` op canonieke branch `main`.
Worker-versie: `f6e569d7-9bfc-4689-b9bf-ad483d8fb4bf`.

Het actuele register is `docs/klink-publication-maintenance-20261024.json`. Deze onderhoudspublicatie herstelt het tekstcontrast en alle 45 lintmeldingen. Ook zijn twee bestaande handleidinglinks zichtbaar onderstreept. De indeling, functies, inhoud, media, opslag en het officiële logo D blijven behouden. De livecontrole omvat 37 toegankelijkheidsscans zonder meldingen, 15 ongewijzigde geometrievergelijkingen, alle twaalf handleidinghoofdstukken en 2.679 byte-identieke mediabestanden. Zie `docs/klink-maintenance-20261024/REVIEW.md` en de livebewijzen in die map.

De actuele, exact begrensde onderhoudsvrijgave is `docs/klink-owner-release-maintenance-20261024.json`. Deze bouwt voort op de goedgekeurde livecommit `2956a13ddfeb8109ffa30caa2ff7330a34729d60` en behoudt het inhoudelijke akkoord uit `docs/klink-owner-release-wordbuild-20261019.json`. Andere ongepubliceerde wijzigingen vallen buiten deze toestemming. De publicatiepoort controleert de onderhoudsscope en bronhashes.

Het eerdere officiële-logo-akkoord blijft vastgelegd in `docs/klink-logo-d-20261024/approval.json`. Het aanvullende herstelpakket staat in `docs/klink-maintenance-20261024/drive-backup.json`. De eerdere volledige inhouds- en mediaback-ups blijven vastgelegd in `docs/klink-logo-d-20261024/drive-backup.json`, `docs/klink-publication-wordbuild-20261019.json`, `docs/klink-publication-wordbuild-drive-20261019.json` en `docs/klink-cumulative-release-20261018/source-drive-verification.json`.

Nico gaf op 19 oktober expliciet opdracht de exact gecontroleerde Basis-selectie van 4.789 aanvullende modelwoordbouwtaken en de bijbehorende niveaukeuze te publiceren. De volledige kleine header, zes oefenspelers, eerdere inhoud, media, routes en opslag blijven behouden.

Alfa A/B/C en A1 gebruiken Basis 1000; A2 gebruikt Basis 2000; B1 gebruikt Basis 5000. Deze lidmaatschappen beschrijven woordenschat, geen zelfstandig leesniveau of behaalde beheersing. De oorspronkelijke 15 onderdelen en 302 lesroutes blijven gelijk. De aanvullende taken worden met een zichtbaar model en docentsteun aangeboden.

De historische bronbestanden behouden hun oorspronkelijke `publicationAllowed:false`/`blocked`-velden. De nieuwe, op exacte bestandshashes gebonden Klink-vrijgave is leidend voor deze afgeleide selectie; dit verandert de algemene Lexicon-bronvrijgave niet. Nieuwe audio en audiokoppelingen blijven gepauzeerd. Niet-geselecteerde woorden, redactionele uitsluitingen en de eerdere 478 uitgesloten kandidaatrecords en vier ongeclassificeerde teksten blijven buiten vrijgave.

Lees ook `PUBLICATIE.md` voor de bestaande publicatieroute en voorwaarden; historische liveverwijzingen daarin zijn geen actuele publicatiebasis. Publiceer alleen een afstammeling van bovenstaande actuele livecommit via `npm run deploy`, met opnieuw passende brongebonden vrijgave. Behoud de publicatiepoort en historische akkoorden. Geen blokkades omzeilen.
