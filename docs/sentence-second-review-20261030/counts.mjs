import{writeFileSync}from'node:fs';
const{availableChapterCollections}=await import(process.cwd()+'/lib/practice-chapters.ts');
const activities=['sentences','find-sentence','sentence-build','sentence-dictation','sentence-speak','word-sentence'];
const counts=activities.map(activity=>({activity,...Object.fromEntries(['a1','a2','b1'].map(level=>[level,availableChapterCollections(activity,{level,help:'guided'}).reduce((s,c)=>s+c.exercises.length,0)]))}));
writeFileSync('docs/sentence-second-review-20261030/counts.json',JSON.stringify(counts,null,2));console.log(JSON.stringify(counts));
