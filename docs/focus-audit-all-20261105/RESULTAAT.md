# Klink en Klink+docent — aanvullende klikrandencontrole

Status: lokaal hersteld en gecontroleerd op 5 november 2026. Niet gepubliceerd, niet gepusht. Live blijft bron 8f310654410c683c772ce889b2164441b8a2a8c0. De canonieke basis voor dit werk is a272037664b8db01967aba2e4d7fe181a49ee1b7.

## Bevinding en gerichte correctie

De gedeelde gewone schermen hadden geen extra ongewenste klikrand. Een browser kan echter bij het openen of sluiten van een venster programmatisch focus verplaatsen en daarbij de toetsenbordrand bewaren na een muisklik. Dit is aangetoond in de vijf Klink+docent-hulpmiddelen, het deelvenster en de uitlegvensters van cursisten.

Een tijdelijke DOM-aanduiding onthoudt nu pointer- tegenover toetsenbordbediening. Uitsluitend de betrokken vensterknoppen en knoppen waarnaar focus terugkeert onderdrukken de outline bij pointerbediening. Tab, Enter en Escape houden de bestaande focusbestemming en zichtbare toetsenbordmarkering. De bestaande gecontroleerde toetsenbordberichten uit het uitleg-iframe herstellen de toetsenbordstatus; origin- en bronvenstercontrole blijven intact.

Vier bronbestanden, 25 toegevoegde regels. Geen wijzigingen aan inhoud, audio, voortgang, selectie-/foutmarkeringen, actieve invoervelden, indeling, typografie, iconen, kleuren, configuratie, dependencies, database, vormgevingsvloer of workflows. De bestaande melding over instructiegeluid bij Klankbord is zowel op live als lokaal gelijk; dit werk claimt geen reparatie of nieuwe audit van audio.

## Uitgevoerde controle

- Alle focus-/outline-regels in de app, productcomponenten, gedeelde menu's en statische pagina's geïnventariseerd.
- 16 scherm-/menutypen × Chromium/WebKit × desktop/mobiel × licht/donker: 128 schermvarianten vóór en na de basisreparatie, 1.064 representatieve stijlproeven per ronde. Alle gecontroleerde elementen kregen toetsenbordfocus; geen ontbrekende focusmarkering of ongewenste pointeroutline buiten functionele invoervelden.
- Alle 128 stilstaande schermparen zijn pixelgelijk boven de gebruikte tolerantie van twee kleureenheden, zonder maatverschil. Deze brede vergelijking betreft de nieuwe DOM-registratie en basisregel; de laatste uitbreiding naar de deel-/uitlegknoppen en iframe-terugkeer is daarna specifiek gecontroleerd.
- Definitieve versie: 48 native vensterproeven (vijf hulpmiddelen plus Delen), inclusief muis openen/sluiten, Tab, Enter en Escape. Lesstatus vóór en na de hulpmiddelen exact gelijk.
- Definitieve versie: 16 uitlegvensterproeven, inclusief informatievenster, Zo oefen je, muis/Enter/Escape, toetsenbordterugkeer uit het iframe en afwijzing van berichten met een onjuiste origin of een verkeerd bronvenster.
- Definitieve versie: acht extra schermafbeeldingenparen tussen de actuele live-app en de lokale versie, buiten focusmomenten: gelijke tekst/geometrie en geen pixelverschillen boven twee kleureenheden. Desktop en mobiel apart bekeken.
- Twee aanraakstromen met echte browseraanraakgebeurtenissen, openen en terugkeren, in Chromium en WebKit op mobiel formaat.
- Normale npm run build inclusief de bestaande prebuildcontroles, TypeScript en lint geslaagd. Inhouds-/mediabestanden zijn ongewijzigd volgens Git. Geen nieuwe publicatiepoort of Actions-run.

WebKit gebruikt bij de venstertests Option/Alt+Tab om, zoals op macOS, alle knoppen met het toetsenbord te bereiken. De eerste diagnostiek bewaart zowel de echte randproblemen als fouten in de testopzet (verkeerde woordenbibliotheekselector, de standaard Tab-instelling en de bestaande afscherming van een actieve docentles). De laatste gerichte reeksen bevatten geen fouten.

## Bron en herstel

De laatste controle gebeurt in /Users/nicoknoester/.cache/klink-focus-audit-20261105 op branch fix/focus-audit-all-klink-20261105. De oorspronkelijke Documents-werkkopie kreeg door macOS uitgeladen cloudbestanden leesproblemen. Daarom is dezelfde canonieke commit opnieuw uit de beschikbare lokale Git-objecten opgehaald; er zijn uitsluitend de vier gecontroleerde wijzigingen overgenomen. De vastgelopen leesproeven zijn geen geslaagde tests. De normale opbouw slaagt wel volledig in de nieuwe lokale werkkopie.

Exacte bronhashes: checks/source-preservation.json. Bronopdracht en afbakening: owner-request.json en SCOPE.md. De bron-/herstelback-up bevat deze wijziging, het Git-herstelpakket, de ruwe controleresultaten en de definitieve schermafbeeldingen. De ongewijzigde inhoud en media blijven herleidbaar tot de vorige volledig gecontroleerde publicatieback-up, waarnaar het manifest verwijst. Het ontvangstbewijs wordt na volledige Drive-teruglezing naast dit rapport bewaard.

Beperkingen: stijlfamilies en relevante venstertypen gecontroleerd, niet iedere herhaalde knop in iedere afzonderlijke les. Geen fysieke telefoonproef, schermlezerproef of nieuwe menselijke luisterronde. Geen volledige nieuwe publicatiecontrole of vrijgave geclaimd; productie en de bestaande publicatiebeveiliging blijven ongewijzigd.
