# Klink

Klink is de digitale oefentool van Taalroute voor Alfabeta+.

De naam staat voor de vijf leerhandelingen:

- Kijken
- Luisteren
- Inoefenen
- Nazeggen
- Koppelen

## Inhoud

- Vastgezette Taalroute-indeling: 337 woordvormen en 338 betekenissen.
- Tien bouwgroepen met 37 basisleesstappen, drie herhaalmomenten en 23 uitbreidingssets.
- Vijf leesroutes voor 78 langere woorden, plus voorbereiding.
- Bestaande Klink-schermen en oefenspelers; geen afzonderlijke nieuwe app.

Negen van de achttien bestaande oefenvormen zijn aan de nieuwe woordindeling gekoppeld. De makerskaart beschrijft ook mogelijke vervolgopdrachten; die mogelijkheden zijn niet allemaal uitgewerkte lessen. De cursist krijgt deze bibliotheek niet als losse keuzelijst te zien.

Media- en publicatievoorwaarden staan in data/klink-release-readiness.json en docs/KLINK-TAALROUTE-OMBOUW.md. Deze werkversie is nog niet live vrijgegeven. Interne statusinformatie staat niet op cursistschermen.

De oude broncatalogus kan voor herstel opnieuw worden opgebouwd met onderstaande opdracht. Dit is niet de actuele Taalroute-leerlijnadapter:

```bash
node scripts/build-package-catalog.mjs
```

## Lokale preview

```bash
npm install
npm run dev
```

Open daarna `http://localhost:3000`.

De oefentoegang voor cursisten gebruikt klascode `ALFA1` en oefencode `2580`. Dit is geen persoonlijke authenticatie. Bewaarde woorden staan lokaal op het apparaat; de oude gedeelde demo-API's zijn gesloten.

## Controle

```bash
npm run verify:catalog
npm run test:review
npx tsc --noEmit
npm run build
```

Uitgebreide browser-, media- en databasecontroles worden lokaal uitgevoerd. De browsertests gebruiken een draaiende preview op poort 18816 (of KLINK_TEST_URL) en Playwright/Chrome; PLAYWRIGHT_MODULE kan naar een bestaande runtime verwijzen. Er worden geen zware GitHub Actions-workflows gebruikt. De UI-review en de grenzen daarvan staan in docs/UI-REVIEW-20261016.md.

## Productie

`https://klink.taalroute.nl`

De productie draait als Cloudflare Worker met D1. GitHub is de bron; ChatGPT Sites wordt niet gebruikt voor de publieke app.

Publiceer alleen via de canonieke branch main en npm run deploy, na bewezen aansluiting op de goedgekeurde liveversie en inhoudelijke vrijgave. Een push naar de werkbranch is geen publicatie. De bestaande publicatiecontrole mag niet worden omzeild.
