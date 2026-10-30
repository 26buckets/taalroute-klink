import{writeFileSync,readFileSync}from'node:fs';
const root=process.cwd();const {chapterCollections,practiceChapters}=await import(root+'/lib/practice-chapters.ts');
const rows=practiceChapters.flatMap(c=>c.activities.flatMap(a=>chapterCollections(a).map(r=>({chapter:c.id,activity:a,id:r.id,level:r.level,exercises:r.contentUrl?JSON.parse(readFileSync('public'+r.contentUrl)).exercises:r.exercises}))));
writeFileSync(process.argv[2],JSON.stringify(rows));console.log(rows.length,rows.reduce((n,c)=>n+c.exercises.length,0));
