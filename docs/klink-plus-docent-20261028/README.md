# Klink + Docent — les mat

28 oktober 2026. Status: **GEBOUWD EN LOKAAL GETEST; NIET GEPUBLICEERD**.

De les staat in de bestaande docentenomgeving bij **Klink + Docent**, route `/#teacher/plus`. De docent bevestigt eerst dat het scherm niet wordt gedeeld, kiest het aanbod en start de les. Alle acht fasen en vijf hulpmiddelen werken binnen hetzelfde scherm. Voorbereiding, variantnamen en observaties worden tijdens de les niet gemount. Afsluiten toont eerst een neutraal gordijn; de voorbereiding verschijnt pas na de expliciete handeling dat delen is gestopt.

## Bron en begrenzing

- Repository: `26buckets/taalroute-klink`; branch `codex/klink-plus-docent-mat-20261028`.
- Uitgangspunt: default branch `main`, commit `4898980d81299fe8c30e25146d3159624fe3c1c7`.
- Vastgestelde livebron via het daadwerkelijke `/release.json`: `bc6ac526f2879962d13b848a4fd63c6c5ce1fd1a`, build 27 oktober 2026. Deze is een voorouder van de uitgangscommit. Het verschil bestaat uit vier documentatiebestanden.
- Geen deployment, merge, wijziging aan publicatiebeveiliging, curriculum, bestaande media, opslagmodel of dependencies. De oude publicatieproef die alleen eerder goedgekeurde bestanden toelaat, blokkeert deze nieuwe feature terecht; dit is geen vrijgegeven release.
- KPD 00–04 zijn volledig gelezen uit de bestaande [Drive-map](https://drive.google.com/drive/folders/1BonW2_yUQW8TAu_mWB1RVfM8iaxq9C7O). Bron-ID's staan in `sources.json`; letterlijke schermteksten uit KPD 02 staan met herkomst in `data/klink-docent-mat.json` en privé in de voorbereiding.
- De Taalroute-ontwerpbasis en bestaande lesbezoekkoppelingen zijn toegepast. De 27 actieve minuten zijn een voorstel voor dit losse lesonderdeel, geen vastgesteld cursusprogramma. Pauze en zelfstandig thuis oefenen vallen daarbuiten. De docent kiest het boekdoel en de werkelijk ingeroosterde bijeenkomst in de voorbereiding.
- De opgegeven lokale DigiBord-stijlsheet was niet beschikbaar. De daadwerkelijke bestaande Klink-tokens, typografie, knoppen en Lucide-iconen zijn gebruikt, met behoud van de appopzet en het ongewijzigde officiële D-logo.

## Softwarekaart

| Bestand | Functie |
|---|---|
| `components/product/staff-apps.tsx` | Eén extra docentmenu-item |
| `app/layout.tsx`, `components/product/classroom-boundary.tsx` | Veilige routegrens vóór het renderen; herstel, terugnavigatie en directe handleidingroutes |
| `components/product/taalroute-header.tsx` | Bestaande header; tijdens de les geen appwissel of menu; fullscreen blijft beschikbaar |
| `components/product/teacher-classroom.tsx` | Voorbereiding, acht fasen, vijf hulpmiddelen en papieruitvoer |
| `components/product/teacher-classroom.css` | Afgeschermde componentstyling, touch en A4-printregels |
| `lib/teacher-classroom.ts` | Canonieke bronverwijzingen, lesplan, tijdelijke status, tegelplaatsing en klankpadvalidatie |
| `data/klink-docent-mat.json` | Les-ID, reviewgrens, 18 brongebonden schermitems; geen tweede lexicon |
| `public/content/klink-docent-audio.json` | Drie afzonderlijke, nog lege foneemverwijzingen |

De bronresolver gebruikt `klink-woord-mat`, `klink-leesstap-01` en `groep-1`. De bestaande foto `/start-tas/mat.webp` en helewoordaudio `/package-audio/taalroute/klink-woord-mat.wav` blijven ongewijzigd. Fase 8 gebruikt daadwerkelijk `exercisesForLesson` en `PackageExerciseBrowser`: drie bestaande mat-oefeningen, zonder het voortgangsdossier van een cursist te beschrijven.

Session storage bevat uitsluitend tijdelijke bediening onder `klink.docent.les.v1`; geen namen, scores of observaties. Docentnotities blijven alleen in het geheugen van het voorbereidingsscherm. Beschadigde status sluit veilig af naar de les; bij geblokkeerde opslag blijft de actieve les beschermd en start herladen in het neutrale toegangsscherm. Volledig offline opnieuw starten is niet beloofd; een reeds geladen les kan zonder netwerk verder.

## Schermkoppeling en didactische grenzen

| Bronitems | Uitwerking |
|---|---|
| F1.1–F1.2 | Foto zonder schrift; apart foto verbergen/vergroten en de mat/mat onthullen |
| F2.1–F2.2 | Helewoordaudio op verzoek, foto, schriftkeuze en aparte zeg-zelf-beurt |
| F3.1–F3.3 | Drie aanwijsbare klanken met afzonderlijk geluid, volgorde en samenvoegen; docent kan ontbrekende klanken voordoen |
| F4.1–F4.2 | Drie vaste vakken, tikken/slepen/toetsenbord, herstelhint, lokale reset; oplossing toont m-a-t in de vakken en bewaart het eigen werk daaronder |
| F5.1–F5.2 | Rustige overgang, woord onthullen zonder foto/automatisch audio; foto/audio pas bij betekeniscontrole |
| F5.3 | Bewust niet actief: geen geverifieerde bekende contrastwoorden; geen tas/map-afleiders |
| F6.1–F6.2 | Foto, mondeling aanwijzen en transfer; door de bron toegestane één-foto-gespreksvariant. Tweede omgevingsfoto blijft productiebehoefte |
| F7.1–F7.2 | Neutrale papierovergang en optioneel woordvoorbeeld; bladen vooraf privé kiezen |
| F8.1–F8.2 | Echte bestaande oefeningen, afronden en opnieuw oefenen; geen leerresultaatscore |

De afzonderlijke docentprompts, verwachte reacties, hulp en feedback staan per bronitem in de voorbereiding. Nazeggen, bouwen, woordherkennen en zelfstandig lezen worden niet als dezelfde prestatie behandeld. Er wordt geen algemeen taalniveau of toetsresultaat afgeleid. Het lesplan koppelt per fase concrete docenthandeling, cursistgedrag, materiaal, observatiepunt en actieve tijd.

## Audio aanvullen

`m`, korte `a` (/ɑ/) en `t` zijn daadwerkelijk `null`. Een kleine rode X staat bij ieder ontbrekend of defect geluid; twee goede bronnen blijven werken als de derde ontbreekt. Het hele woord, letternamen en TTS zijn geen vervanging. De audio wordt nooit automatisch gestart in de leesbeurt.

Na aanlevering: controleer opname, rol/stem-ID, rechten, Taalroute-bestandsmetadata en menselijke klankreview; plaats de drie afzonderlijke bestanden onder `/klank-audio/docent/` en vul alleen het JSON-register aan. Herladen of **Geluid opnieuw controleren** leest het register zonder cache opnieuw. Alleen technisch geladen bronnen worden afspeelbaar; dat is geen kwaliteitsgoedkeuring. De testfixtures worden uitsluitend in de browser onderschept en zijn geen geleverde fonemen.

## Lokaal starten en controleren

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 18928
node --test scripts/test-teacher-classroom.mjs
node scripts/test-teacher-classroom-browser.mjs
node scripts/test-teacher-classroom-edges.mjs
npx tsc --noEmit
npm run build
```

Voor de browsertests is Playwright met Chrome en WebKit nodig. Het is hier via de bestaande lokale hulpmiddelen beschikbaar gesteld; er is geen dependency toegevoegd. Gebruik `KLINK_URL` voor een andere lokale test-URL en `KLINK_DOCENT_OUTPUT` voor een andere bewijsmap. Alle zware controles worden lokaal uitgevoerd. Er zijn geen GitHub Actions-workflows toegevoegd.

De functionele suite bevat 147 gecontroleerde toestanden over Chrome/WebKit en drie varianten, plus acht gerichte fout-/bedieningsscenario's. Bestaande curriculumcontroles: 48 geslaagd en één bestaande expliciete skip; bestaande logo-, menu- en Alfa-C-controles slagen. Types, gerichte lintcontrole, unitchecks en productiebuild slagen. De oorspronkelijke publicatie-whitelisttest blijft bewust blokkerend. Zie `ACCEPTATIE.md` en de opgeslagen bewijsbestanden.

## Papier, beeldreview en open punten

Er zijn vijf afzonderlijke A4-PDF's: drie cursistenbladen, letterkaartjes en een private docentobservatie. Alle pagina's zijn gerenderd en visueel nagekeken; cursistenbladen hebben uitsluitend de neutrale titel **DE MAT**, geen variant-/niveau-/systeemlabels. Tekst, letters, lijnen en logo blijven scherp in de PDF. Lijnen en contrast zijn tevens in grijswaarden beoordeeld. Dit zijn gecontroleerde werkbladexports, geen reeds goedgekeurde complete boekdrukbestanden.

De bestaande matfoto is 800 × 800 pixels en in de uiteindelijke PDF ongeveer 55 mm breed: gemeten circa **369 ppi**. Origineel voldoende op dit geplaatste formaat; geen Krea-enhancement uitgevoerd of geclaimd. De volledige foto en de plaatsing zijn visueel gecontroleerd op scherpte, perspectief, contact met de vloer, beeldfouten en richting. Er zijn geen mensen/zichtbare handen of door mensen gebruikte voorwerpen in dit beeld; een handenherstel is niet nodig. Bestaande assetreview en mediarechten blijven `open`, zonder nieuw akkoord te claimen.

Open vóór vrijgave: drie menselijk gereviewde foneemopnamen, menselijke review van woordaudio/beeld en rechten, onafhankelijke tegenreview, fysieke bord-/printertest en klasproef. Voor de tweefotoversie van het uitbreidingsblad is een tweede passend beeld nodig; de huidige versie gebruikt de expliciet toegestane mondelinge transfer. De zoomtest simuleert CSS-zoom, geen handmatig bediende browserzoom of echt digibord.

**Vergeet niet je afbeeldingen te boosten/controleren vóór het drukken.**

De Drive-overdracht bevat werkbladen, bewerkbare gewijzigde bron, exacte bronkopieën, ongewijzigde gebruikte media, bewijs, checksums en een Git-herstelbundel met de uitgangscommit als vereiste. Dit is een taakback-up; het ongewijzigde volledige bestaande Klink-project wordt hersteld via de vastgelegde repositorybasis. Back-up is geen publicatie.
