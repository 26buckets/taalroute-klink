import assert from 'node:assert/strict';
import {readFileSync, writeFileSync, mkdirSync, existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {groupExercises} from '../lib/group-practice.ts';
import {productionPack} from '../lib/production-practice.ts';
import {isInstructionAudioEnabled,isWithdrawnAudio} from '../lib/audio-policy.ts';

const read=f=>JSON.parse(readFileSync(f));
const hash=b=>createHash('sha256').update(b).digest('hex');
const xml=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const lists=read('docs/audio-words-20261030/lists.json').lists;
const media=read('data/klink-media.json');
const instructions=read('data/klink-instructions.json').items;
const spoken=read('data/klink-production-instructions.json');
const instructionText={listen:'Luister. Tik op de foto die bij het woord hoort.',read:'Lees het woord. Luister als je hulp nodig hebt.',match:'Zoek de paren. Kies een woord en een foto die bij elkaar horen.',cards:'Lees het woord. Luister als je hulp nodig hebt.'};
const index=read('data/klink-production-index.json').filter(r=>!r.id.startsWith('beta-images:'));
const words=new Map(), collections=[];
mkdirSync('public/package-media/klink-placeholders-20261030',{recursive:true});
mkdirSync('docs/placeholders-20261030',{recursive:true});
for(const list of lists){
 const source=read('public'+list.sourceUrl).exercises;
 const row=index.find(r=>r.id===list.sourceCollection);assert(row);
 const selected=source.map(item=>{
  const id=item.wordId,word=item.helpWord,known=media[id];
  // The previously rejected receipt is kept out of new placements.
  let image=known?.imageUse!=='context'&&word!=='bon'?known?.image:undefined;
  const placeholder=!image;
  if(placeholder){
   image=`/package-media/klink-placeholders-20261030/${hash(id).slice(0,16)}.svg`;
   const size=Math.min(48,Math.floor(430/(word.length*.58)));
   const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" role="img" aria-label="${xml(word)} — afbeelding volgt"><rect width="512" height="512" rx="16" fill="#f1f3f2"/><rect x="18" y="18" width="476" height="476" rx="10" fill="none" stroke="#dce2df"/><text x="256" y="256" text-anchor="middle" dominant-baseline="middle" font-family="Inter,Arial,sans-serif" font-size="${size}" font-weight="400" fill="#344e53">${xml(word)}</text><text x="256" y="455" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="18" fill="#677b7c">Afbeelding volgt</text></svg>`;
   writeFileSync('public'+image,svg);
  }
  assert(existsSync('public'+image));assert(existsSync('public'+item.prompt.audio.src));assert(!isWithdrawnAudio(item.prompt.audio.src));
  if(!words.has(id))words.set(id,{id,word,meaning:item.meaning,image,status:placeholder?'placeholder':'bestaande-afbeelding',lists:[]});
  const registered=words.get(id);assert.equal(registered.word,word);assert.equal(registered.image,image);
  registered.lists.push({level:list.level,title:list.title,sourceId:item.exerciseId});
  return {id,word,meaning:item.meaning,image,audio:item.prompt.audio.src};
 });
 assert.equal(selected.length,12);assert.equal(new Set(selected.map(w=>w.word)).size,12);
 const pack={...productionPack(row),id:`beta-images:${row.id}`,words:selected,practiceActivities:['listen','read','match','cards'],exercises:selected.map(w=>({exerciseId:`card:${w.id}`,wordId:w.id,componentId:'ALF-CMP-016',mode:'word-card',title:'Bekijk het woordkaartje.',assessment:'participation',cards:[{cardId:w.id,front:{image:{src:w.image,altText:w.word}},back:{text:w.word},audio:{src:w.audio,audioId:w.id}}],instructionAudio:instructions.find(i=>i.modes.includes('word-card'))}))};
 for(const activity of pack.practiceActivities){
  const instruction=spoken.find(i=>i.text===instructionText[activity]);assert(instruction&&isInstructionAudioEnabled(instruction.src)&&instruction.voiceId==='h6uBOiAjLKklte8hdYio');
  const id=`beta-images:${activity}:${list.level}:${row.id.split(':').at(-1)}`;
  const exercises=groupExercises(pack,activity).map((e,i)=>({...e,instructionAudio:{src:instruction.src,audioId:instruction.id},exerciseId:`${id}:${String(i+1).padStart(2,'0')}`,sourceExerciseId:`${id}:${String(i+1).padStart(2,'0')}`,contentLevel:list.level,vocabularyLevels:[list.level],sourceContentIds:source.filter(s=>e.targetWordIds.includes(s.wordId)).map(s=>s.exerciseId),sourceDocumentId:source[0].sourceDocumentId,sourceStatus:'source-reviewed-20261029',combinationReview:'beta-word-placeholders-20261030',independentReading:false,reviewEligible:false,access:'supported-listening',imageCompletion:'beta; word labels explicitly replace missing images',feedback:'Kijk nog eens. Kies het woord of de afbeelding die erbij hoort.'}));
  assert.equal(exercises.length,activity==='match'?4:12);
  for(const e of exercises){if(e.options)assert.equal(e.options.length,4);assert(e.sourceContentIds.length);}
  const placeholderWords=new Map([...words.values()].filter(w=>w.status==='placeholder').map(w=>[w.image,w.word]));
  function markImages(value){if(Array.isArray(value))value.forEach(markImages);else if(value&&typeof value==='object'){if(placeholderWords.has(value.src))value.placeholderWord=placeholderWords.get(value.src);Object.values(value).forEach(markImages);}}
  markImages(exercises);
  const bytes=JSON.stringify({id,exercises}),url=`/practice-content/klink-20261029/beta-images-${activity}-${list.level}-${hash(id).slice(0,8)}-${hash(bytes).slice(0,16)}.json`;
  writeFileSync('public'+url,bytes);
  const placeholderCount=selected.filter(w=>words.get(w.id).status==='placeholder').length;
  const added={activity,level:list.level,help:'practice',image:null,id,title:`${list.title} · beelden`,url,count:exercises.length,placeholderCount};
  index.push(added);collections.push(added);
 }
}
writeFileSync('data/klink-production-index.json',JSON.stringify(index));
writeFileSync('docs/placeholders-20261030/registry.json',JSON.stringify({date:'2026-10-30',scope:'48 complete practical word lists; textual placeholders are not completed photos or a visual-recognition assessment',words:[...words.values()],collections},null,2));
console.log(JSON.stringify({lists:lists.length,collections:collections.length,exercises:collections.reduce((n,r)=>n+r.count,0),words:words.size,placeholders:[...words.values()].filter(w=>w.status==='placeholder').length}));
