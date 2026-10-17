import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { taalroutePackages as packs } from '../lib/taalroute-packages.ts';
import { connectedContent, contentForStep, contentReadingConditions } from '../lib/connected-content.ts';
import curriculum from '../data/klink-curriculum.json' with { type: 'json' };
const out = 'outputs/content-connection-20261017';
mkdirSync(out, { recursive: true });
const linked = new Set(connectedContent.flatMap(item => item.wordIds));
const textTokens = new Set(connectedContent.flatMap(item => item.text.toLocaleLowerCase('nl').match(/\p{L}+(?:['’-]\p{L}+)*/gu) ?? []));
const notAnchored = curriculum.words.filter(word => !linked.has(word.id)).map(word => ({ id: word.id, word: word.word, meaning: word.meaning, occursInText: textTokens.has(word.word), firstReading: word.firstReading }));
const overview = {
  curriculum: curriculum.release, independentReading: false, humanReview: 'open', published: false,
  explanation: 'De bestaande opgenomen editie is ongewijzigd aangesloten. Woordverbanden zijn plaatsingsvoorstellen, geen verklaring dat de betekenis, uitspraak of volledige leesbelasting is goedgekeurd. De begeleide woordlessen blijven gelijk.',
  counts: Object.fromEntries(['sentence', 'text', 'dialogue'].map(kind => [kind, connectedContent.filter(item => item.kind === kind).length])),
  unanchoredWords: notAnchored,
  sourceIssues: [
    { contentId: connectedContent.find(item => item.text.includes('De andere spelers vragen hij'))?.id, issue: 'Bestaande tekst bevat: “De andere spelers vragen hij de huidige ronde nog afmaakt.” De aansluiting bewaart tekst en opname; redactioneel herstel en eventueel bijpassende audio apart beoordelen.' },
    { contentId: connectedContent.find(item => item.title === 'Het boek terugbrengen')?.id, issue: 'Het oude tekstregister en de bestaande opgenomen spelertekst verschillen in de formulering van Mo’s antwoord. De reeds aan audio gekoppelde spelertekst is behouden; geen eigen nieuwe formulering gebruikt.' },
  ],
  routes: packs.flatMap(pack => pack.lessons.map(lesson => ({ packageId: pack.id, lessonId: lesson.id, title: lesson.title, words: lesson.words,
    items: contentForStep(lesson).map(item => ({ contentId: item.id, kind: item.kind, title: item.title, readingConditions: contentReadingConditions(item, lesson) })) }))),
};
writeFileSync(`${out}/leesvoorwaarden-en-plaatsing.json`, JSON.stringify(overview, null, 2));
const backups = JSON.parse(readFileSync(`${out}/original-audio-backups.json`));
for (const entry of backups) {
  const file = `work/source/downloads/${entry.name}`;
  assert.equal(statSync(file).size, Number(entry.metadata.size));
  entry.localSha256 = createHash('sha256').update(readFileSync(file)).digest('hex');
}
writeFileSync(`${out}/original-audio-backups.json`, JSON.stringify(backups, null, 2));
writeFileSync(`${out}/LEESMIJ.txt`, [
  'KLINK — BESTAANDE INHOUD AANGESLOTEN, 17 OKTOBER 2026',
  '',
  'De bestaande Taalroute-app, woordenbank en 302 korte woordroutes zijn behouden.',
  '1.292 verschillende zinnen, 192 teksten en 128 gesprekken zijn aan de eigen Taalroute-woorden gekoppeld. De gesprekken behouden hun vier beurtopnamen en sprekers. Zes dubbele zinnen zijn samengevoegd; alle 1.618 bronvoorkomens blijven herleidbaar in het interne register.',
  'De eerdere twaalf luistermodellen blijven in de lesroute, maar worden niet dubbel getoond in de tekstenbibliotheek. De acht eerdere begripsvragen blijven werken.',
  '',
  'WAAR STAAT HET?',
  'Cursist: Lessen → kies een onderdeel → Zinnen en teksten of Gesprekken. Filter op de woorden van een leesstap. Openen start de opname; bij een gesprek spelen de beurten achter elkaar. Tekst aantikken herhaalt de opname. Ook beschikbaar bij Vrij oefenen.',
  'Docent: Oefenkaart → kies een leesstap → Bestaande zinnen, teksten en gesprekken. Hier staan de overige woorden, klanktekens, leesvoorwaarden, taalbelasting en oorspronkelijke bespreekvragen met antwoorden/bewijsplaatsen.',
  '',
  'GRENZEN',
  'Luisteren en meelezen is deelname, geen zelfstandig lees- of begripsresultaat. Lange A1/A2-inhoud wordt niet automatisch aan een vroege woordles toegevoegd. De docent bereidt betekenis en zinsverband voor en kiest passende inhoud.',
  'Er zijn geen teksten, gesprekken, vragen, stemmen of nieuwe opnamen geschreven/geproduceerd. Inhoudelijke media- en betekenisbeoordeling blijft open; er is niet live gepubliceerd.',
  `Geen eigen contextanker: ${notAnchored.map(word => `${word.word}${word.occursInText ? ' (wel in teksten; geen zelfstandig doel)' : ' (geen exacte vorm gevonden)'}`).join(', ')}. Zie de betekenissen en voorwaarden in leesvoorwaarden-en-plaatsing.json; pak heeft twee betekenissen.`,
  'Twee bekende bronverschillen/-problemen zijn in leesvoorwaarden-en-plaatsing.json vastgelegd, niet stilzwijgend herschreven.',
  '',
  'CONTROLES EN HERSTEL',
  'source-ledger.json bewaart de oorspronkelijke teksten, vragen, sprekers en precieze audioherkomst. WAV-geluidsdata zijn byte-identiek gehouden; bij MP3 zijn de audiopakketten zonder hercodering overgenomen en gehasht. Alle 1.979 afleverbestanden hebben gecontroleerde Taalroute-merkgegevens.',
  'audio-check.json bevat de controle per bestand. De dertien oorspronkelijke audioarchieven zijn in Drive teruggevonden; namen en groottes zijn met de lokale bronnen vergeleken. Locaties en lokale hashes staan alleen in original-audio-backups.json. Geen bronlinks op het cursistenscherm.',
  'unit-tests.log, full-review.log en browser-check.json bevatten de lokale controles. Geen zware GitHub Actions gestart.',
  'Herstel: pak alle gelijknamige genummerde back-updelen uit over dezelfde map. De originele audioarchieven blijven op hun bestaande Drive-locatie. Een back-up is geen publicatie.',
].join('\n') + '\n');
console.log(JSON.stringify({ counts: overview.counts, routes: overview.routes.length, linkedMeanings: linked.size, noContextAnchor: notAnchored.length }));
