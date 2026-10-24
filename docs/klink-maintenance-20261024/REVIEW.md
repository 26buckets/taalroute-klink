# Klink — contrast en lint, 24 oktober 2026

Opdracht van Nico: los het bestaande contrastpunt en de 45 lintmeldingen op, zonder indeling of functies te veranderen; controleer en publiceer daarna.

De bron is een afstammeling van de bevestigde livecommit 2956a13ddfeb8109ffa30caa2ff7330a34729d60. Andere chats en hun ongepubliceerde werk zijn niet overgenomen.

## Wijziging

- De kleine introductietekst op de startpagina krijgt een donkerdere kleur. Geen verandering aan lettertype, lettergrootte of afmetingen.
- Tekstlinks in de handleiding krijgen een onderstreping. De aanvullende scan vond dat twee links in hoofdstuk 1 voorheen alleen met kleur werden onderscheiden.
- Interne handleidinglinks gebruiken de bestaande routercomponent; adressen en routes blijven hetzelfde.
- Ongebruikte imports, sorteerfuncties en typeconversies zijn gecorrigeerd. De read-only auditscript valideert expressies met de standaard JavaScript-parser zonder ze uit te voeren.
- Gedeelde componenten gebruiken passende native groeps-/statussemantiek. Decoratieve elementen krijgen geen onjuiste link-, lijst- of separatorrol. Aanroepers behouden hun labels en inhoud.
- Mobiele breedtedetectie en carrouselnavigatie volgen browserstatus via Reacts externe abonnement. Bij het wisselen van een oefening wordt antwoordstatus vanuit de bestaande navigatiehandeling gereset. De oude compacte speler trekt focus niet meer ongevraagd naar een invoerveld; toetsenbordbediening blijft beschikbaar.

## Behoud en controle

De lintconfiguratie is ongewijzigd: geen regels uitgezet of bestanden uitgesloten. Data, media, bibliotheekinhoud, afhankelijkheden en het officiële D-logo zijn bytegelijk aan de livebasis. De 15 geometrievergelijkingen van startpagina, handleidingoverzicht en hoofdstuk 1 op vijf schermbreedtes tonen gelijke posities en afmetingen. Alle twaalf handleidinghoofdstukken zijn op desktop en mobiel met Axe gecontroleerd. Samen 37 toegankelijkheidsscans zonder meldingen. Navigatie, browser-terug, mobiele menutoestand en terugkeer naar dezelfde Klink-oefenbibliotheek zijn gecontroleerd.

Een aanvullende browserfixture controleert de werkelijk gewijzigde gedeelde componenten: mobiele omschakeling, label- en addonfocus, toetsenbordknoppen, native groepen, carrouselnavigatie en opnieuw aankoppelen, en resetten van de oude compacte oefenspeler. Deze componentfixture is een lokale componenttest, geen afzonderlijke live-app.

## Publicatiebeveiliging

De historische inhoudsakkoorden blijven intact. Het nieuwe opvolgende onderhoudsakkoord bindt uitsluitend deze expliciete opdracht, de livebasis en exacte bestandshashes. De poort controleert de oude inhoudsakkoorden, afstamming, ongewijzigde overige runtimebronnen en de exacte onderhoudsscope. De foutinjectietests controleren onder meer geweigerde scope-uitbreiding, ontbrekende toestemming en gewijzigde hashes. Publicatie verloopt uitsluitend via npm run deploy op schone main.

Zie de testlogs, behoudscontrole en het uiteindelijke publicatieregister voor de definitieve status.

De volledige oefenregressie is geslaagd. Eén bestaande toetsenbordtest wacht nu met een actionability-proef tot zijn knop werkelijk bedienbaar is; de standaardspelers en inhoudsimport zijn daarna opnieuw volledig geslaagd. Er zijn geen inhoudelijke assertions verwijderd.
