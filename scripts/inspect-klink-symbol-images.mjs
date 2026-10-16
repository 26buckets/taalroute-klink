import { readFileSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const source = process.env.KLINK_SOURCE_ROOT;
if (!source) throw Error('Provide the original Taalroute source directory.');
const words = JSON.parse(readFileSync('data/klink-curriculum.json')).words;
const media = JSON.parse(readFileSync('data/klink-media.json'));
const archive = 'work/source/media-afronding.zip';
const readArchive = path => JSON.parse(execFileSync('unzip', ['-p', archive, path]));
const candidates = new Map();
for (let n = 2; n <= 16; n++) {
  const cp = `CP${String(n).padStart(3, '0')}`;
  const content = readArchive(`herstelgegevens/pakketten/${cp}/bron.json`);
  const catalog = readArchive(`herstelgegevens/pakketten/${cp}/mediacatalogus.json`);
  content.words.forEach((row, i) => {
    const word = words.find(word => word.word === row[0] && !media[word.id]?.image);
    const image = catalog.images[`${cp}-IMG-WORD-${String(i + 1).padStart(2, '0')}-V1`];
    if (!word || !image?.url?.endsWith('.svg') || candidates.has(word.id)) return;
    const file = join(source, 'pakketten', cp, image.url);
    if (!statSync(file).blocks) throw Error(`Source is not materialized: ${word.id}`);
    const svg = readFileSync(file, 'utf8');
    if (/<script|<foreignObject|(?:href|src)\s*=\s*["']https?:/i.test(svg)) throw Error('External or active SVG content.');
    candidates.set(word.id, { id: word.id, word: word.word, meaning: word.meaning, sourceMeaning: row[1], source: file, sha256: createHash('sha256').update(svg).digest('hex'), instruction: 'Kijk en luister.', review: 'open', svg });
  });
}
const out = 'outputs/media-completion-20261016';
mkdirSync(out, { recursive: true });
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const items = [...candidates.values()];
writeFileSync(`${out}/symbol-candidates.json`, JSON.stringify(items.map(({ svg: _svg, ...item }) => item), null, 2));
writeFileSync(`${out}/symbols.html`, `<!doctype html><html lang="nl"><meta charset="utf-8"><title>Klink — bestaande symboolbeelden beoordelen</title><style>body{font:18px system-ui;margin:24px;background:#eef2f1;color:#173f48}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}article{padding:12px;background:white;border:1px solid #aabcbc}img{width:100%;height:180px;object-fit:contain}h2{margin:4px 0;font-size:24px}p{margin:4px 0;font-size:15px}</style><h1>Bestaande woordbeelden — inhoudelijke controle, niet vrijgegeven</h1><p>Opdracht: Kijk en luister. Daarna woord en beeld herkennen. Een beeld mag het woord niet alleen uitschrijven.</p><div class="grid">${items.map(item => `<article id="${escape(item.id)}"><h2>${escape(item.word)}</h2><img src="data:image/svg+xml;base64,${Buffer.from(item.svg).toString('base64')}" alt=""><p>${escape(item.meaning)}</p></article>`).join('')}</div></html>`);
console.log(`${items.length} bestaande SVG-kandidaten; geen runtimekoppelingen gewijzigd.`);
