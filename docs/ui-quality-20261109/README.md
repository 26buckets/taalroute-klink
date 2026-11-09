# Lokale UI-verbetering Klink — 9 november 2026

Status: lokale kandidaat, niet gepubliceerd. De liveversie is ongewijzigd. De oorspronkelijke vastgezette vormgeving en publicatiebeveiliging zijn niet aangepast.

## Uitgevoerd

| Onderwerp | Concrete verbetering |
|---|---|
| Oefenstappen | Bij een tekst op mobiel/tablet leidt **Maak de opdracht** naar het antwoordpaneel. De knop voltooit niets en bewaart geen fictief antwoord. Bij een voorbeeld heet hij **Bekijk voorbeeld**. |
| Navigatie | Beschikbare oefenvormen staan vóór niet-beschikbare vormen. Alle vormen, twaalf hoofdcategorieën, niveaus en bestaande links blijven bestaan. |
| Starten | **Stap voor stap** krijgt een rustige nadruk. **Kies zelf een oefening** maakt het alternatief duidelijk. De bestaande leerroutes blijven intact. |
| Mobiel | Woorden zoeken blijft zichtbaar; extra filters klappen open. De gekozen filters worden geteld en kunnen worden gewist zonder de zoekterm te verwijderen. |
| Woorden vinden | Een exact woord staat vóór woorden die ermee beginnen en vóór andere gedeeltelijke overeenkomsten. Alle kaarten en betekenissen blijven behouden. |
| Herkenbare bediening | De gedeelde luister-, foto- en tekstknoppen hebben zichtbare korte labels, met behoud van hun bestaande toegankelijke namen en werking. |
| Klink+docent | Zoeken in lessen en werkbladen, resultaatmelding en herstel bij geen resultaten. Zoeken blijft staan bij terugkeer. De mobiele bovenbalk neemt minder ruimte in; Vorige/Volgende blijft zichtbaar. |
| Kleurinstelling | De keuze heet **Kleur van menubalk**: dat beschrijft het bestaande gedrag eerlijk. De oefenruimte heeft geen nieuwe kleuren gekregen. |

## Behoud en grenzen

20.182 bronbestanden voor inhoud en media byte voor byte vergeleken met de actuele basis, waaronder 13.891 audiobestanden: geen wijziging. Alleen de tekst van de bestaande kleurinstelling is in een publiek script aangepast. Geen nieuwe inhoud, opnamen, opslagformaten, externe diensten of afhankelijkheden. Geen push, cloudtest of publicatie; geen extra betaalde dienst.

De goedgekeurde logo's, lettertypes, hoofdkleuren, twaalf hoofdcategorieën, niveauknoppen, klankenkaart, verborgen B2-ruimte, bewaarvoorziening en hoofdroutes blijven behouden. De gevraagde kleinere UI-wijzigingen zijn zichtbaar in de lokale voorbeelden; ze zijn geen nieuwe live-referentie. De afzonderlijk genoemde DigiBord-stijlmap was lokaal niet beschikbaar; daarom is de bestaande Klink-vormgeving hergebruikt.

## Controles

Zie `checks.json` en de logs/schermbeelden in het herstelpakket. Getest in Chromium en WebKit, op desktop, tablet en mobiel, inclusief 320 pixels breed, lichte/donkere menubalk en toetsenbordbediening. De controles toetsen onder andere echte audio, opgeslagen antwoorden, terugkeer, oude links, zoekfilters, labels, afmetingen en volledige bereikbaarheid van oefeninhoud.

De historische publicatiecontracten zijn bewust niet herschreven. Dit is geen vrijgave om direct te publiceren. Voor een volgende publicatie moeten de actuele livebasis, deze kandidaat, de bijgewerkte specifieke vormgevingsreferenties en de normale publicatiecontrole opnieuw samen worden bevestigd.

## Wat een 9,5 nog niet bewijst

Automatische controles en een visuele review zijn geen onafhankelijke toegankelijkheidscertificering of gebruikerstest. Er is geen eindscore van 9,5 toegekend. Laat cursisten zelf een oefening kiezen, de twee luisterfuncties onderscheiden, een opdracht afronden en een bewaard woord terugvinden. Laat een docent een les en werkblad terugvinden. Observeer zoekwerk, vergissingen en benodigde uitleg; herstel concrete knelpunten daarna gericht. De afbeeldingen/audio/inhoud hoeven daarvoor niet opnieuw gemaakt te worden.

## Herstellen

De kandidaat staat in branch `codex/ui-quality-20261109`, vanaf `0e72bf0ead44306e77b85dd06ae4856e663ad755`. Het herstelpakket bevat de gewijzigde bronnen, een toepasbare patch, een Git-bundel met deze afstamming, controle-uitvoer en zichtbare voorbeelden. Ongewijzigde media blijven gedekt door de bestaande Klink-media- en bronback-ups in dezelfde Drive-projectmap.
