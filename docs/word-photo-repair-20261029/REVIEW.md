# Woordfoto’s — eerste herstelronde, 29 oktober 2026

Opdracht: achttien vierkante vervangingen, zonder witte vrijstaande achtergrond; alle oude foto's bewaren, in het bijzonder de vijf broodjes. Nieuwe fotoachtige beelden zijn gegenereerd met de ingebouwde image_gen, geen documentaire opnamen. De concrete opdracht van 29 oktober geldt voor deze generatie; de eerdere stop bij Gesprekken wordt niet algemeen opgeheven.

## Bewaring en koppeling

`manifest.json` bevat de originele mediarecord, bronhash, vervangingspad en nieuwe hash per woord. Alleen achttien afbeeldingspaden in `data/klink-media.json` zijn gewijzigd. Audio, inhoud, niveau, routes, beoordelingen, contextstatus en gebruikersopslag zijn ongewijzigd. De oorspronkelijke appbestanden staan nog op hun oude pad. De vijf broodjes zijn bovendien als `previous-originals/vijf.webp` in het herstelpakket bewaard.

`generation.json` bewaart de exacte prompts en gegenereerde bronpaden. Het herstelpakket bevat de achttien volledige PNG-bronnen, achttien oude bestanden, compacte appkopieën en reviewgegevens. Webkopieën: 768 × 768, WebP, kwaliteit 86, zonder bijsnijden of inhoudelijke nabewerking. De vierkante PNG-bronnen blijven onaangetast.

## Visuele controle

Alle achttien volledige beelden bekeken. Onderwerp, achtergrond, perspectief, ondersteuning, kijkrichting en aanwezigheid van witte uitsnijdingen gecontroleerd. Geen witte vrijstaande achtergronden; personen kijken naar elkaar, hun taak of opzij. Detailuitsneden van alle zichtbare handen bekeken, ook de kleine achtergrondpersonen bij stoep en trein. Natuurlijk afgedekte vingers zijn niet als ontbrekend beoordeeld. Geen zichtbare handfout aangetroffen; dit is modelreview, geen menselijke goedkeuring of praktijktest met cursisten.

| Woord | Controle en resultaat |
| --- | --- |
| machine | Complete draaibank met werkplaats, geen zwevend uitgeknipt apparaat. |
| feest | Taart, kaarsen en versiering in huiskamer; gasten richten zich op elkaar. Hand op schoot en overlappende handen van man gecontroleerd; overige handen afgedekt. |
| goed | Duim omhoog naar gesprekspartner. Vier zichtbare handen gecontroleerd, inclusief pencontact en rustende handen. Blijft contextbeeld: goed is geen zelfstandig voorwerp. |
| goud | Grote herkenbare goudbaren op werkbank, metaalglans en stempel; geen handen. |
| hand | Eén complete hand, vijf correct aangesloten vingers en pols; houtachtergrond. |
| huid | Close-up van arm en huidtextuur, geen hand zichtbaar. |
| ik | Hand op eigen borst tijdens gesprek, vijf vingers en contact gecontroleerd. Blijft contextbeeld. |
| heb | Eigen sleutels rusten in open hand; greep, ondersteuning en gedeeltelijke vingerafdekking gecontroleerd. Blijft contextbeeld en vraagt woord/zin als steun. |
| kin | Grote kin zonder spiegelverdubbeling; wijsvinger raakt onderkant kin. Zichtbare vinger en deel van hand gecontroleerd. |
| lam | Eén jong lam, geen volwassen schaap; natuurlijke grasomgeving. |
| pijn | Pijnlijke gezichtsuitdrukking met beide handen aan knie; twee handen, polsen en kniecontact gecontroleerd. |
| stoep | Doorlopende tegels, stoeprand en straat zichtbaar. Kleine achtergrondwandelaar en beide handgebieden bekeken; weinig detail door afstand, geen zichtbare afwijking. |
| tand | Tanden veel groter in beeld dan voorheen; natuurlijke mond. Er zijn meerdere tanden zichtbaar, met de voortanden centraal. Geen claim dat het beeld zonder taalsteun het enkelvoud afdwingt. |
| touw | Groot touw op echte houten kade, geen witte uitsnijding. |
| trein | Trein op spoor naast perron; kleine achtergrondpersonen bekeken, handen grotendeels afgedekt of onscherp, geen zichtbare afwijking. |
| vijf | Groot daadwerkelijk huisnummer 5. Oude broodjesfoto behouden. |
| voet | Voet met vijf tenen centraal; geen been als hoofdonderwerp. |
| wangen | Beide wangen zichtbaar; twee wijsvingers raken zijkanten zonder ze te bedekken, beide handen gecontroleerd. |

## Lokale verificatie

`scripts/test-word-photo-repair.mjs` controleert oude hashes, ongewijzigde overige media-eigenschappen, vierkant formaat, webbestandsgrootte en runtimekoppelingen. Browserronde: alle achttien echte woordkaarten op 1366 × 950 en 390 × 844; laden, vierkante weergave, geen horizontale overflow of paginafouten. Schermbeelden en detailreviews zijn bijgevoegd. De bestaande curriculum- en spelercontroles slagen (16 tests). Geen publicatie uitgevoerd. Herkenbaarheid bij cursisten en eigenaarbeoordeling blijven open.
