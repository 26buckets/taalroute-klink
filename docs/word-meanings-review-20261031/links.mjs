import {readFileSync,writeFileSync} from 'node:fs';
import {productionIndex} from '../../lib/production-practice.ts';
import {displayedChapterCollections,chapterHash,parseChapterHash,practiceChapters} from '../../lib/practice-chapters.ts';
const links={};
for(const row of productionIndex.filter(r=>r.activity==='read-series')){
 const level=row.level,help=row.help,chapter=practiceChapters.find(c=>c.activities.includes(row.activity)).id;
 const location={chapter,activity:row.activity,level,help};
 const collections=displayedChapterCollections(row.activity,location);
 for(const e of JSON.parse(readFileSync('public'+row.url)).exercises){
  const word=e.textBlocks.map(b=>b.text).join(' ');
  const collection=collections.find(c=>c.wordRound?.sourceId===row.id&&c.wordRound.exerciseIds.includes(e.exerciseId))||collections.find(c=>c.id===row.id)||{id:row.id};
  if(!collection)continue;
  const hash=chapterHash({...location,collection:collection.id});
  if(parseChapterHash(hash).collection!==collection.id)throw Error(hash);
  (links[word]??=[]).push({level,exerciseId:e.exerciseId,collection:collection.id,hash,meaning:e.meaning??'',audio:e.textBlocks[0].audio.src});
 }
}
writeFileSync('docs/word-meanings-review-20261031/direct-links.json',JSON.stringify(links,null,2));console.log('Validated links for',Object.keys(links).length,'word forms');
