# Klink

Klink is de digitale oefentool van Taalroute voor Alfabeta+.

De naam staat voor de vijf leerhandelingen:

- Kijken
- Luisteren
- Inoefenen
- Nazeggen
- Koppelen

## Inhoud

- Pakket 1: zeven teksten, van Alfa A tot en met B1
- Pakket 2: vier teksten per route tot en met A2
- B1 bij Pakket 2: zichtbaar als aparte pilotbank

Iedere tekst bevat acht activiteiten voor lezen, tekstbegrip, woordherkenning, volgorde, spreken en schrijven. De audioteksten zijn voorbereid, maar audio wordt pas aangezet na vrijgave.

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
