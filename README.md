# Klink

Klink is de digitale oefentool van Taalroute voor Alfabeta+.

De naam staat voor de vijf leerhandelingen:

- Kijken
- Luisteren
- Inoefenen
- Nazeggen
- Koppelen

## Inhoud

- CP001: 2 lessen, 20 kernwoorden, 542 oefeningen, 12 teksten en 8 dialogen
- CP002: 4 lessen, 20 kernwoorden, 645 oefeningen, 12 teksten en 8 dialogen
- De pakketbrowser is voorbereid op uitbreiding van CP003 tot en met CP016

Beide pakketten gebruiken 18 componentfamilies, waaronder kijken en luisteren, kiezen, klankcontrast, koppelen, bouwen, typen, lezen, luistervragen, nazeggen, schrijven, formulieren, handschrift, volgorde en spellen. De pakketmedia blijven als interne proef gemarkeerd zolang menselijke beeld-, luister- en runtimecontroles openstaan.

De afgeleide pakketgegevens en compacte webbeelden worden opnieuw opgebouwd met:

```bash
node scripts/build-package-catalog.mjs
```

## Lokale preview

```bash
npm install
npm run dev
```

Open daarna `http://localhost:3000`.

De demo voor cursisten gebruikt klascode `ALFA1` en pincode `2580`.

## Controle

```bash
npm run build
```

Uitgebreide browser-, media- en databasecontroles worden lokaal uitgevoerd. Er worden geen zware GitHub Actions-workflows gebruikt.

## Productie

`https://klink.taalroute.nl`

De productie draait als Cloudflare Worker met D1. GitHub is de bron; ChatGPT Sites wordt niet gebruikt voor de publieke app.
