# Klink — lokale codecontrole, 1 november 2026

Alle 443 resterende codemeldingen zijn opgelost. De volledige lintcontrole, typecontrole en productieopbouw slagen. Geen controleregels uitgezet. Opmaak, broninhoud, lessen, woordaudio, beoordeling en opslag zijn behouden. Er zijn geen productiebatches gemaakt, imports uitgevoerd, commits gepusht of publicaties gedaan. Geen GitHub Actions gestart.

## Wat is hersteld

387 testaanroepen zijn expliciet als door de testrunner beheerde taken gemarkeerd. Alle oorspronkelijke testnamen en aantallen blijven gelijk. Proeven bevestigen dat zowel een synchrone fout als een afgewezen asynchrone taak nog steeds de test laat mislukken. Overige meldingen betreffen onder meer variabeledeclaraties, ongebruikte imports, eenduidig sorteren, bestandscodering en correct aanroepen van de oorspronkelijke audiomethode.

In de app zelf zijn uitsluitend vier verouderde afbeeldingsinstellingen vervangen in drie componenten. Vroeg laden en hoge laadprioriteit blijven behouden. Geen stylesheets, inhoudsbestanden, media, afhankelijkheden, instellingen of routes gewijzigd. De oude vrijgavebewijzen zijn niet herschreven: een afzonderlijke lokale controle legt iedere gewijzigde bronbyte vast en controleert de voorgeschiedenis op haar oorspronkelijke bron.

## Uitgevoerde lokale controles

- Volledige lintcontrole: 443 naar 0 meldingen; typecontrole en productieopbouw geslaagd.
- 22 gerichte unit- en beveiligingsproeven geslaagd, zonder caching of uitgeschakelde controles. Vergelijking van alle 109 gewijzigde testbestanden: in 105 alleen expliciet `void`; in 108 alle oorspronkelijke assertions exact gelijk. Alleen de actuele integratietest gebruikt de nieuwe gecontroleerde bronlaag.
- De extra historische archiefreeks is afgebroken wegens herhaalde controle van de gehele publicatiegeschiedenis per oude proef; niet als geslaagd opgevoerd. De huidige volledige publicatiepoort is wel uitgevoerd. De volledige historische archiefreeks blijft dus niet-afgerond, en is geen onderdeel van de geslaagde telling.
- 96 grammatica-browserproeven: Alfa A, B, C, A1, A2 en B1; zelfstandig oefenen, antwoorden, voortgang, lessen en aanklikbare woordaudio.
- 12 instructie-opmaakproeven, inclusief 320px; daarnaast 12 pixelgelijke voor/na-vergelijkingen van start- en beginschermen. Chromium en WebKit, desktop/mobiel, licht/donker.
- 6 aanvullende browserflows met echte oorspronkelijke audio en toetsenbordbediening. Herstelproef bevestigt dat het oorspronkelijke antwoord bewaard blijft en mislukte opslag geen voorbeeld vrijgeeft.
- 1.200 schrijftestflows en 8 controles van bestaande weergave/beoordeling geslaagd; 128 toetsenbordindelingen, 12 vooruit-tijdens-audio-proeven en 2 echte audio-/voortgangsproeven geslaagd.
- Bestaande componentfixtures geslaagd, inclusief de oudere oefenspeler.
- Metadata van 1.979 gekoppelde opnamen gecontroleerd. Basiscontrole: 338 woordopnamen en 338 beelden, 12 contextopnamen, 20 instructieopnamen en 7 begripopnamen; geen ontbrekende bestanden binnen die basiscontrole. Dit is geen nieuwe menselijke uitspraakgoedkeuring.
- De normale publicatiecontrole meldt uitsluitend de twee bedoelde blokkades: verkeerde publicatiebranch en geen publicatievrijgave voor deze lokale kandidaat.

## Afbakening en nog nodig voor publicatie

Deze beurt ruimt codecontrolepunten op binnen bron `d2357393224209a19f22fa0b2c7b013fe16f8b9c`. De eerdere integratie gebruikte de toen geverifieerde livebron `0c130f80053537b9976906b859e844a267912295`. Voor een eventuele publicatie moet opnieuw worden vastgesteld wat dan daadwerkelijk live staat; parallelle wijzigingen kunnen inmiddels verder zijn. Daarna zijn een brongebonden vrijgave en de gewone publicatiepoort nodig.

Geen fysieke telefoon, schermlezer of nieuwe menselijke NT2-/uitspraakronde uitgevoerd. De lokale 18 Alfa/B1-oefeningen hebben 131 gekoppelde woordvormen zonder ontbrekende lokale opname. De eerder vastgelegde 19 ontbrekende woordvormen elders in de oude A1/A2-proefinhoud blijven buiten deze codecorrectie; zie de vorige integratiecontrole. Volledige zinsaudio voor Alfa C/B1 en de inhoudelijke/roostergoedkeuring van B1 blijven afzonderlijke productiestappen. Deze technische controle verklaart niet de complete methode productiegereed.

## Herstel en uitvoering

Branch: `codex/klink-local-checks-20261101`; bron: `d2357393224209a19f22fa0b2c7b013fe16f8b9c`; bron vóór opschoning: `422d7fcc`. Deze wijzigingen zijn lokaal vastgelegd. De back-up bevat een Git-bundel vanaf de vorige bron `b51dff3809b3f7ae6dfac2653def13101977ba2c`, de gewijzigde bronbestanden, controles en screenshots. De voorafgaande volledige integratieback-up staat in dezelfde Drive-projectmap, bestand `1kjoAtgwM-wNBCE319BuLDsMN-E_tgyye`. Daardoor zijn bestaande ongewijzigde audio en historische bronnen eveneens herstelbaar.

De tijdelijk gebruikte uitvoeringshulp voor de afgebroken archiefreeks veranderde geen appcode. De einduitslag berust op de gewone lint-/type-/bouw-/publicatiecontroles, de 22 gerichte proeven en de genoemde browser- en mediacontroles. Afbreekmeldingen van de extra archiefstarts zijn geen geslaagde testuitslagen.

De bronback-up is volledig teruggelezen en alle 292 manifestbestanden zijn gecontroleerd: [Google Drive](https://drive.google.com/file/d/1WvhNVPhuug9VYHNK8Pduu9ffzvIbXUDe/view). De gecombineerde controle en de link naar het bewijspakket staan in `backup-controle.json`.

CODEX WORK: percentage niet meetbaar.
