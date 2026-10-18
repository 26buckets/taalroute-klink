# Klink: van losse oefeningen naar korte leerreeksen

## Status

Gebouwd op de canonieke main-bron na livecommit
`31c093549965cb316dc90505e67a1c42cb5679fe`. Geen wijziging van Lexicons
woordplaatsing, de vijftien onderdelen, de 302 lesroutes of bestaande media.
Deze bouwronde is nog niet gepubliceerd. De nieuwe uitleg en samenstellingen
hebben de status concept; onafhankelijke taal-/didactiekbeoordeling en een
cursistproef zijn niet uitgevoerd. De publicatiepoort blijft gesloten voor deze
uitbreiding totdat een nieuwe, inhoudsgebonden vrijgave is vastgelegd.

## Geobserveerde vergelijking

Op 18 oktober 2026 werkten Nico's geopende Chrome-sessies daadwerkelijk:

- ABC, lijst 2: de woordenpagina met alle twintig woorden en aanklikbare klankdelen.
- Klanken, contrast a/aa: geopende luister-/sorteeropdracht met twee categorieën.
- Regels, meervoud: geopende koppel-/sorteeropdracht met enkelvoud en meervoud.
- Het Regels-menu toonde daarnaast onder meer persoonswoorden, bezit, ontkenning,
  vraagwoorden, hebben/zijn, meerdere werkwoorden, zinsvolgorde, verbindingswoorden
  en tijden. Dit is een menuwaarneming, geen volledige werkingstest van die reeksen.

Er zijn geen antwoorden ingestuurd, geen instellingen gewijzigd en geen opnamen,
teksten, afbeeldingen of implementaties overgenomen. Alleen algemene
interactiepatronen en didactische functies vormen de vergelijking. Drie bekeken
spelers bewijzen geen volledige gelijkwaardigheid met DigLin Plus.

## Wat deze bouwronde toevoegt

| Ingang in Oefenen | Inhoud | Afbakening |
| --- | --- | --- |
| Klanken → Klanken in woorden | 98 korte reeksen; eerste, middelste en laatste klank bij 92 bestaande doelwoorden | Hele woordopnamen, geen verzonnen losse-klankaudio; transparante drieklankwoorden, met docentsteun |
| Spelling → Zo schrijf je het | 21 reeksen bij 59 doelwoorden; letterparen, lange klinkers, open lettergrepen en dubbele medeklinkers | Vier patroonfamilies, geen volledig spellingprogramma |
| Grammatica → Zo maak je een zin | 36 reeksen; wij/we-vormen en ja/nee-vragen uit bestaande zinnen | Overige persoonsvormen, ontkenning, tijden en samengestelde zinnen blijven open |
| In de praktijk → Van gesprek naar zelf doen | 120 bestaande gesprekken gekoppeld aan begrip, een eigen beurt en een bericht | Geen nieuwe situaties, formulieren of vrije spreektaak toegevoegd |
| Teksten → Lezen en begrijpen | 156 bestaande teksten gekoppeld aan bronvraag, bewijszin en herhaling | Geen nieuwe teksten of hogere niveaulijn; de bron blijft raadpleegbaar |
| Samen herhalen → Oefen opnieuw | Terughaalopdrachten die op dit apparaat al zijn gedaan, met planning na 1, 3 en 7 dagen | Alleen de nieuwe leerreeksen; niet persoonsgebonden, geen beheersingsdiagnose |

Dit zijn oefenreeksen, niet 431 nieuwe lessen of nieuwe broninhouden. Een voorbeeld,
oefening en herhaling met hetzelfde woord zijn geen drie unieke woorden. De
woord- en grammaticareeksen bevatten maximaal vijftien handelingen. De kortste
regelreeksen blijven bewust kort: bus/bussen en jas/jassen zijn twee bestaande
woordparen; boom/bomen, boot/boten, raam/ramen, muur/muren en buur/buren vijf.
Vul de woordvoorraad later gericht aan vanuit Lexicon, niet met ongecontroleerde
generatie om een streefaantal te halen.

## Leeropbouw, hulp en beoordeling

Voorbeeld → oefenen → toepassen → terughalen. De speler blijft gelijk van formaat.
Een cursist gaat bewust verder; deze reeksen schakelen niet onverwacht automatisch.
Een voorbeeld vraagt één keer Verder en wordt alleen als deelname vastgelegd.
Voorbeelden in de collectiekaart verdwijnen uit de paginatitel tijdens de opdracht,
zodat ze geen luister- of spellingantwoord verklappen. Keuzes blijven staan na
een fout; Voorbeeld onthult hulp en registreert die hulp.

Bij klankopdrachten blijft het antwoord gesloten totdat de hele woordopname
is afgespeeld. De afgekeurde losse t blijft buiten gebruik. Een drieletterwoord
wordt niet automatisch als drieklankwoord behandeld: de bestaande segmentatie
en klankwaarden zijn leidend. Grotere woorden en afwijkende klankwaarden worden
niet op spelling alleen als klankmodel gegenereerd.

Open-lettergreep- en verdubbelingsopdrachten benoemen de bestaande enkelvoudsvorm
als afzonderlijke voorbereiding. De bestaande leesvoorwaarden blijven gekoppeld.
Grammaticavragen gebruiken exacte bronzinnen, geen nieuw gegenereerde zinnen.
De voorbeeldzin staat pas bij Voorbeeld; hij verklapt niet vooraf de werkwoordkeuze.

Gesprekken behouden hun rollen, bronvragen en schrijfcriteria. Een eigen opname
of zelf nagekeken bericht telt als deelname, niet als uitspraak- of schrijfgoedkeuring.
De tekstbegripreeks combineert bestaande onderdelen; het opnieuw beantwoorden van
dezelfde vraag bewijst geen nieuwe leesstrategie of transfer naar een onbekende tekst.

De herhaalplanning slaat alleen oefen-ID, laatste oefenmoment, vervolgmoment en
intervalstap lokaal op. Geen naam, opname of geschreven bericht in die planning.
Fouten, hulp en meerdere pogingen zetten de intervalstap terug. Herhaald klikken
op een goed antwoord binnen dezelfde dag verlengt het interval niet. De planning
is een praktische oefenregel, geen gevalideerd adaptief model. Bij gedeeld
browsergebruik is dit een gedeelde planning, geen persoonlijk cursistprofiel.

## Audio en productie

Achttien nieuwe uitleg-/opdrachtteksten hebben stabiele ID's in de bestaande
audiomatrix: `learning:<regel-id>:instruction` en `learning:<regel-id>:example`.
Er zijn geen nieuwe opnamen gegenereerd en geen ontbrekende opnamen als beschikbaar
voorgesteld. De door Nico ingetrokken instructieaudio blijft uit. Bestaande
woord-, zin-, tekst- en gespreksaudio blijft 0,85×. Nieuwe uitleg is daarom voorlopig
voor gebruik met docentsteun, niet voor volledig zelfstandige inzet door niet-lezers.

## Verbinding met de ontwerpbasis

De vaste ontwerpbasis is lokaal en via het vastgelegde Drive-bestand gelezen.
Dit is aanvullend materiaal bij de bestaande Lexicon-/CP-bronlessen, geen nieuw
cursusprogramma. Iedere oefening bewaart de bronopdracht, les-ID en relevante
leesvoorwaarden. De docent kiest de reeks bij het reeds geplande lesdoel en
controleert betekenis en voorbereidende klanken vóór de start.

De huidige bron geeft geen concrete ingeroosterde bijeenkomst, boekpagina of
vastgelegde observatiepuntcodes voor deze nieuwe samenstellingen. Die koppeling,
actieve tijd en eventuele zelfstandige tijd blijven daarom expliciet open; ze
worden niet afgeleid uit aantallen appstappen. Dit is geen claim dat het volledige
boek-/cursusprogramma-/lesplan-/observatiekader al klaar is.

## Nog te bouwen voor het afgesproken minimum

- Losse goedgekeurde klankmodellen, articulatie, synthese en ruimere klankcontrasten.
- Meer regeltoepassingen en onbekende transferwoorden na voorbereiding.
- Persoonsvormen buiten wij/we, ontkenning, vraagwoorden, bezit, tijden en complexere zinnen.
- Zelfstandige spreekopdrachten, echte formulieren en uitgebreidere praktische routes.
- Meer leesstrategieën en een expliciete opbouw naar zelfstandige tekstverwerking.
- Persoonsgebonden herhaling over alle bestaande oefenvormen, indien gewenst.

De vergelijking blijft dus open. Werkende extra reeksen zijn geen bewijs dat
de volledige breedte van DigLin Plus al is gerealiseerd.

## Afgeronde lokale controle

De volledige lokale regressiereeks is geslaagd: 75 unit-/inhoudstests en
122 browsercontrolepunten. Daarna is één uitlegzin afgestemd op de werkelijke
keuzehandeling; het audioregister en de complete nieuwe leerreekscontrole zijn
opnieuw geslaagd. TypeScript, gerichte codecontrole, witruimtecontrole en de
productiebuild slagen. De volledige repository heeft nog bestaande,
niet-gerelateerde lintmeldingen; die wordt niet als volledig foutvrij gemeld.

De eindcontrole heeft onder meer antwoordlekken in titels, de doorgang na
tekstvoorbeelden, foutfeedback, hele leerreeksen, toetsenbordbediening,
schermbreedtes en de koppeling met Herhalen afgedekt. De vijftien onderdelen,
302 lesroutes, bestaande media, losse oefeningen en werkbladen zijn behouden.
Er is geen menselijke screenreadertest of cursistproef uitgevoerd. De
cursistproef is op Nico's verzoek geen afzonderlijke publicatievoorwaarde.

De publicatiecontrole blokkeert terecht op ontbrekende nieuwe inhoudsgebonden
vrijgave. Er is niet gepubliceerd, gepusht of in GitHub Actions getest.
Zie `klink-learning-paths-review-20261018.json` voor de precieze afbakening.
