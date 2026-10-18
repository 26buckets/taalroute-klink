# Klink — tweede menureview en tegenlezing

18 oktober 2026. Deze ronde bouwt voort op KLINK-MENUREVIEW-20261018.md.
De eerdere review blijft als historisch verslag staan; de namen in dit verslag
zijn leidend voor de aangescherpte ontwikkelversie. Geen publicatie of push.
De livebron is opnieuw gecontroleerd: 31c093549965cb316dc90505e67a1c42cb5679fe.

## Afbakening

Review vanuit acht invalshoeken: beginnende lezer, digitaal onervaren cursist,
docent, didactiek, informatiearchitectuur, toegankelijkheid, terugvinden en
technische betrouwbaarheid. Dit zijn invalshoeken van één agent, geen acht
menselijke experts. De oefenproductieskill bewaakt dat deelname, menu-aanbod
en beheersing niet met elkaar worden verward. De code-/React-review richt zich
op bestaande spelers, behouden opslag, toegankelijke bediening en kleine fixes.

Geen nieuwe oefeningen, audio, media, niveaus of woordindeling. De vijf
hoofdknoppen, twaalf hoofdstukken, vijftien woordonderdelen en 302 lesroutes
blijven staan. De audiopauze blijft gelden. Geen nieuw vormgevingssysteem; de
opgegeven DigiBord-stijlbestanden ontbreken nog op het bekende pad.

## Eerste review van deze ronde

1. **Eén bestemming had twee namen.** De knop bij de woorden en de paginakop
   heetten Samen oefenen; de tab heette Oefeningen. Een docent die een tabnaam
   noemt, moet niet een anders genoemde pagina hoeven uitleggen. Alle drie
   heten nu Oefeningen. De docentwijzer is meegewijzigd.
2. **Meer opdrachten was niet blijvend bij terugkeer.** De hoofdstukpagina
   zette het zichtbare aantal bij iedere interne navigatie terug op twaalf.
   Opdracht dertien openen en teruggaan verborg daardoor de gekozen kaart.
   Het zichtbare aantal blijft nu per vaardigheid/niveau behouden gedurende
   het bezoek. Een rechtstreekse opdrachtlink bereidt dezelfde terugkeer voor.
3. **Teruggaan gaf geen herkenbaar aanknopingspunt.** Ook met meer zichtbare
   resultaten begon de cursist weer bovenaan. Terugkeer uit een hoofdstukopdracht
   plaatst nu de gekozen kaart in beeld en geeft die toetsenbordfocus. Dit
   geldt voor de eigen terugknop en browser Terug, ook op smalle schermen.
4. **Oude herhaalgegevens konden een lege bestemming beloven.** Herhalen keek
   alleen of een opgeslagen herhaling aan de beurt was, niet of die opdracht
   nog bestaat. Oefen opnieuw verschijnt nu alleen bij daadwerkelijk
   beschikbare herhaalinhoud. Oude gegevens worden niet gewist.
5. **De gemengde ronde verloor haar menumarkering.** Binnen Lessen was bij
   Alles oefenen geen onderdeelstab actief. De bovenliggende tab Lessen blijft
   nu herkenbaar actief; teruggaan opent de leskeuze.

## Advocaat van de duivel en verwerking

- **Alles oefenen belooft meer dan de vier gemengde woordvormen.** Hernoemd naar
  Woordenmix in de leskeuze, Herhalen en de speler. Geen activiteiten verwijderd
  of toegevoegd. De docentwijzer benoemt de beperkte betekenis.
- **Samen oefenen kan klinken alsof een tweede persoon verplicht is.** De
  uniforme naam Oefeningen vermijdt die suggestie; opdrachten met begeleiding
  behouden hun eigen voorwaarden.
- **De oplossing voor terugvinden mag niet alles ineens uitstallen.** De
  eerste pagina blijft twaalf kaarten. Meer opdrachten blijft een bewuste
  keuze; alleen bij terugkeer wordt de eerder gekozen kaart weer zichtbaar.
- **Een sprong naar een kaart mag geen lange schermanimatie opleveren.** De
  terugkeer gebruikt geen soepele schuifanimatie. In de mobiele hercontrole
  bleek dat de focus/scroll pas na de schermindeling moet plaatsvinden; dit
  is met een annuleerbare volgende schermverversing opgelost.
- **Een lege herhaalpagina is geen reden om willekeurige opdrachten te tonen.**
  Bij ontbrekende voorbereiding blijft de bestaande ingang Kies woorden staan.
  Er worden geen resultaten, succes of beheersing verzonnen.
- **Twee keer Lessen kan eenvoudiger lijken als je het woordenoverzicht overslaat.**
  Dat zou de expliciet gewenste gezamenlijke woordpagina weghalen. Daarom blijft
  de volgorde bewust intact en legt de docentwijzer de twee keuzes uit.

## Actuele klikroutes

- Lessen → fotokaart → alle woorden → Lessen → Start: kleine lesroute.
- Lessen → fotokaart → Oefeningen → oefenvorm: oefenen met die woordgroep.
- Lessen → fotokaart → Lessen → Woordenmix: gemengde woordronde.
- Oefenen → vaardigheid → oefenvorm → opdracht: rechtstreeks oefenen; terug
  naar de opdrachtkeuze houdt de gekozen kaart in beeld.
- Herhalen → Oefen opnieuw: alleen beschikbare herhaling die aan de beurt is.
- Herhalen → Woordenmix: voorbereide mix uit bewaarde woorden/afgeronde lessen,
  alleen als er genoeg geschikte woorden zijn.

## Tweede review en grenzen

Gerichte browsercontrole geslaagd op 1366, 820, 390 en 320 pixels: gelijke
benamingen, actieve bovenliggende tab, opdracht dertien na Meer opdrachten,
terugknop, browser Terug, herladen van een directe opdrachtlink, toetsenbordfocus,
geen horizontale overloop, ongeldige herhaal-ID en een echte herhaalopdracht.
TypeScript, gerichte lintcontrole en diffcontrole zijn geslaagd.

De screenshotcontrole vond nog een zichtbaarheidsprobleem: na een tik had de
teruggevonden kaart wel focus, maar geen herkenbare focusrand. Daarom is de
bestaande focusstijl ook op programmatische terugkeer toegepast. Deze laatste
CSS-aanpassing verandert geen afmetingen of routes. De volledige lokale
regressieketen is daarvoor geslaagd (75 unittests en 131 aanvullende
script-/browsercontrolepunten); daarna is de volledige menutest opnieuw
geslaagd, met aanvullende controles op een zichtbare focusrand.
Daarbij is ook de docentwijzer gecorrigeerd: de focusvariabele bevat een kleur,
geen volledige randinstelling. Dikte en lijnstijl zijn nu expliciet vastgelegd
voor de links en de uitklapknop, en de werkelijk berekende stijl wordt getest.

De productiebuild van de definitieve versie is geslaagd. Gerichte lint- en
diffcontroles zijn opnieuw geslaagd. Alle controles liepen lokaal; geen
GitHub Actions-run gestart, geen push en geen publicatie. De eerdere back-up
blijft bewaard; deze ronde krijgt een eigen archief en uploadcontrole.

Geen menselijke gebruiksproef of schermlezertest uitgevoerd. Het menu blijft
voor een beginnende niet-lezer een begeleide ingang; iconen en korte woorden
zijn geen bewijs van zelfstandig begrip. De bestaande audio is niet veranderd.
De DigLin-inhoudsvergelijking en de vrijgave van eerdere nieuwe leerreeksen
blijven afzonderlijk open. Deze menureview maakt die inhoud niet automatisch af.
