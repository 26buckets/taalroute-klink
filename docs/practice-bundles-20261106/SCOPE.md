# Lokale bundeling — 6 november 2026

Opdracht: oefenbestanden bundelen en lokale bestandslimietwaarschuwing toevoegen. Geen publicatie, push, cloudrun of budgetwijziging.

Basis: origin/main a31d800770cb03a4275f033b2c1534aef873e4dd; werkelijk live cefd22e (volledig: cefd22e3220decc663a0e982f63d912906ac4ea9; spaties verwijderen), gecontroleerd via release.json. De schone bron is een afstammeling van deze livecommit. Oude lokale gedeelde Git-objecten bleken beschadigd; daarom een onafhankelijke clone.

Bereik: deterministische bundelgenerator, afzonderlijk afleverregister, bestaande productionAssetUrl-aanroeper, exacte uitsluiting van gebundelde bestanden, gerichte middleware voor oorspronkelijke bestandsadressen vóór de bestaande publieke-bestandsrouter, bestaande Cloudflare-assetsbinding, lokale preview, bestandslimietcontrole na build, bijbehorende tests. Geen wijziging van bronindex, oefeningen, audio, opslag, speler, CSS, vormgevingsvloer of publicatiepoort.

Risico's om te controleren: byteverlies, verkeerde bank bij gedeelde bundel, te grote bundels, oude links, fout/herstel, onbedoeld laden op Start, opgeslagen antwoorden/voortgang, nieuwe netwerklast, uiterlijk desktop/mobiel/licht/donker. Oude bestandslinks gebruiken voortaan de Worker; de huidige app haalt bundels rechtstreeks als statische bestanden op.

Bestaande lintproblemen in drie Hoor-en-typ-controles hersteld zonder gedrag te wijzigen (overbodige objectspreiding en expliciete sorteervergelijking). Historische bewijsbestanden en inhoudsakkoorden blijven intact.
