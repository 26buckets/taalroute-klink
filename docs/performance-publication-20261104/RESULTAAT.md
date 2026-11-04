# Gepubliceerd en live gemeten

Klink en Klink+docent zijn gepubliceerd vanuit canonieke main, bron `dc37a479a7a6f148d61ffb5140dfd79112331f85`, Worker `886d4b64-a6bc-42bb-92f2-41ff7bb91dfb`. Inzicht staat afzonderlijk op bron `121b801ebe87c1ca9bb83c581fe0e412f22bb17d`, Worker `608b9163-18db-441a-b09e-ae9a75b07954`. De bronbestanden zijn gecontroleerd tegen de nieuwste inhoud, inclusief de teruggezette Spelling-HOLD. PR10 en Inzicht PR1 zijn samengevoegd; PR8/staging is niet gepubliceerd.

## Geldige livevergelijking: eerste bezoek

Mediaan in seconden, vóór → na. Klink heeft twaalf eerste bezoeken per route en versie: Chromium/WebKit, desktop/mobiel, drie herhalingen. Inzicht heeft 24 eerste bezoeken per versie. Zelfde huidige netwerk, echte browser en netwerkverzoeken; geen onderschepping of kunstmatige vertraging. Een eerste browserbezoek bewijst geen koude Cloudflare Worker.

| Onderdeel | Vóór | Na | Lagere mediaan |
|---|---:|---:|---:|
| Klink Start | 4,68 s | 2,83 s | 40% |
| Klink cursistomgeving | 6,47 s | 3,56 s | 45% |
| Klink+docent | 4,79 s | 3,35 s | 30% |
| Inzicht inlogscherm | 0,51 s | 0,45 s | 12% |

Inzicht over alle 48 eerste/herhaalde bezoeken samen: 0,397 → 0,324 seconde, 18% lagere mediaan. Dat is een andere selectie dan de tabel. De opvolgende handelingen bij Klink zijn afzonderlijk gemeten; er is geen aantoonbare verschuiving van de winst naar de volgende knop. Dit zijn opeenvolgende steekproeven, geen gerandomiseerde veldproef of garantie voor ieder netwerk.

## Correctie van de herhaalmeting

Bij de eindreview bleek dat fragmentnavigatie de oude documentklok kon behouden: 12 cursist-herhaalrijen en zes +docent-herhaalrijen per oorspronkelijke reeks. Daarom gebruikt de primaire tabel uitsluitend eerste bezoeken. De oorspronkelijke ruwe gegevens en de afgekeurde gemengde samenvattingen blijven bewaard in `live-before/`, `live-after/` en `excluded/`. Zij mogen niet als 72 onafhankelijke starts per versie worden aangehaald. Eerdere gemengde cold/warm-tabellen uit de performancevoorbereiding zijn evenmin bewijs van echte herlaadtijden voor deze routes.

De meethelper dwingt nu een nieuwe documentklok af en controleert dit met een unieke document-ID. Aanvullende liveproeven voor cursist en +docent meten elk 24 echte eerste/herhaalde bezoeken. Voor de cursistomgeving is ook de actuele lokale basis opnieuw identiek vóór/na gemeten: eerste bezoek 3,147 → 1,590 seconde; herladen 3,175 → 1,317 seconde. Dat lokale resultaat is geen livecijfer. De aanvullende live cursist-herlaadtijd is 1,632 seconde; daarvoor is geen geldige oorspronkelijke live-herhaalnulmeting beschikbaar, dus geen live verbeterpercentage.

## Audio en behoud

In twaalf native audioproeven per versie dalen drie afspeelacties van drie naar één aanvraag. Gemeten totale browseroverdracht: 50.335.093 → 25.070.457 bytes, ongeveer 50% minder. Dit is niet hetzelfde als 67% minder netwerkdata: browsers behandelen range- en cacheverzoeken verschillend. De tweede opname begint mediaan na 182 → 144 ms. De opnamen en metadata zijn ongewijzigd.

Lokaal: 34 gerichte tests, types, gerichte lint, normale bouw, 16 loadergevallen, 16 laad-/herstelgevallen, 44 audio-/bedieningscontroles, acht vertraagde navigatiestromen, vier handleidingstromen en 24 exact gelijke schermparen. De brongebonden publicatiepoort en twaalf negatieve controles op toestemming, bron, bewijs en back-up slagen. De huidige build biedt 19.999 bestanden binnen de bestaande limiet; geen media verwijderd of hostingbudget verhoogd. Geen GitHub Actions toegevoegd of uitgevoerd.

Live: 32 aangeboden JS/CSS-bestanden exact teruggelezen, zes ingetrokken banken blijven 404, de tien vernieuwde Alfa B-opdrachten zijn bytegelijk, acht extra controles van de oude docentroute en handleiding werken. Geen externe SQL, nieuwe opname, inhoudswijziging, authenticatiewijziging of echte cursistgegevens gebruikt. Inzicht: volledige lokale school-/recht-/bewaar-/herstelproef, 32 live openbare bestanden exact, anonieme beschermde endpoints blijven 401.

## Open en beperkingen

De netwerkpieken zijn niet overal aantoonbaar verbeterd. De langzaamste eerste cursiststart in de primaire reeks was na publicatie 9,144 seconde tegenover 8,111 vóór publicatie, terwijl de mediaan wel daalt. Ook de Inzicht-p95 verbetert niet. De omvangrijke eerste download van de cursistomgeving en de variatie tussen netwerken blijven aandachtspunten. Geen fysieke telefoon of echte persoonlijke MFA-login getest; beveiliging is behouden en lokaal gecontroleerd, geen claim dat MFA sneller is geworden. De 36 spellingdictees en 14 vervolgkandidaten blijven op HOLD voor hun afzonderlijke bronreview.

Herstelbron en alle lokale controles: Drive `1kB_fkUUt7YyllmQr5dD-oegIsso15-L-`, volledig teruggelezen. Het definitieve pakket voegt de liveproeven, meetcorrectie en de opvolgende meethelper toe. De documentatieopvolger op main is geen nieuwe runtime-uitgave en moet niet afzonderlijk worden gedeployd.
