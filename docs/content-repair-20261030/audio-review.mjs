import {readFileSync,writeFileSync} from 'node:fs';
import {connectedContent} from '../lib/connected-content.ts';
import {allPackageWords} from '../lib/package-content.ts';
import {importedItems} from '../lib/imported-practice.ts';
const changes=JSON.parse(readFileSync('docs/content-repair-20261030/source-changes.json')).changes;
const _original=JSON.parse(readFileSync('/Users/nicoknoester/Documents/Codex/2026-10-30/wat-ik-zo-bijzonder-vind-is/outputs/klink-contentreview/bevindingen.json'));
const ids=new Set(changes.filter(c=>c.path[0]==='data/klink-connected-content.json').map(c=>connectedContent[c.path[2]].id));
for(const c of changes.filter(c=>c.path[0]==='data/klink-imported-practice.json'))for(const id of importedItems[c.path[2]].sourceIds)ids.add(id);
for(const c of changes.filter(c=>c.path[0]==='data/klink-functional-writing.json'))ids.add(JSON.parse(readFileSync(c.path[0])).items[c.path[2]].contentId);
// Include the two reviewed spoken-content defects still awaiting a replacement recording.
for(const id of ['klink-dialogue-579b29dc10de977f','klink-sentence-790dabeb9573eae5'])ids.add(id);
const audio=new Map();
for(const item of connectedContent.filter(x=>ids.has(x.id)))for(const block of item.blocks)audio.set(block.audio.src,{src:block.audio.src,text:block.text,contentId:item.id,blockId:block.id});
for(const word of allPackageWords)if(ids.has(word.id)&&word.audio)audio.set(word.audio,{src:word.audio,text:word.word,contentId:word.id});
writeFileSync('docs/content-repair-20261030/audio-scope.json',JSON.stringify({sources:[...ids],files:[...audio.values()]},null,2));console.log('Audio files',audio.size);
