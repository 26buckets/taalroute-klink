import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {chapterCollections} from '../lib/practice-chapters.ts';
import {groupActivities} from '../lib/group-practice.ts';
import {learningGoalFor} from '../lib/learning-goals.ts';
import {readBeforeLocalInstructionCorrections} from './check-later-content-revisions.mjs';
const matrix=JSON.parse(readFileSync('docs/learning-goals-20261101/approved-matrix.json'));
const rows=gunzipSync(readFileSync('docs/learning-goals-20261101/approved-mapping.jsonl.gz')).toString().trim().split('\n').map(JSON.parse);
const expected=new Map(rows.map(r=>[r.exerciseId,r.goalId]));
test('all existing variants match the approved goal matrix; source exercises stay unchanged',()=>{
 let checked=0,added=0;const ids=new Set(),modes=new Set(),newIds=new Set();
 for(const activity of groupActivities)for(const row of chapterCollections(activity.id)){
  const exercises=row.contentUrl?JSON.parse(readFileSync('public'+row.contentUrl)).exercises:row.exercises;
  for(const exercise of exercises){const before=JSON.stringify(exercise),goal=learningGoalFor(exercise);assert(goal,exercise.exerciseId);if(expected.has(exercise.exerciseId))assert.equal(goal.id,expected.get(exercise.exerciseId),exercise.exerciseId);else{assert.equal(exercise.answerPolicy,'exact-copy');assert(exercise.exerciseId.startsWith('KSW-AC-TN-'));assert.equal(goal.id,'overschrijven');assert.equal(goal.learnerText,'Je oefent om de tekst precies over te nemen.');added++;newIds.add(exercise.exerciseId);}assert.equal(JSON.stringify(exercise),before);assert(goal.displayLabels.length>=1&&goal.displayLabels.length<=2);assert(goal.learnerText.startsWith('Je oefent om '));checked++;ids.add(exercise.exerciseId);modes.add(exercise.mode);}
 }
 assert.equal(added,100);assert.equal(newIds.size,99);assert.equal(checked,matrix.scope.catalogueVariants+added);assert.equal(ids.size,matrix.scope.uniqueExerciseIds+newIds.size);assert.equal(modes.size,matrix.scope.rendererModes);
});
test('goal copy and light/dark label colors equal the approved matrix',()=>{
 const data=JSON.parse(readFileSync('data/klink-learning-goals.json'));assert.deepEqual(data.families,matrix.families);
 for(const goal of matrix.goals)assert.deepEqual(data.goals[goal.id],Object.fromEntries(['family','displayLabels','learnerText'].map(k=>[k,goal[k]])));
 const luminance=hex=>hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((sum,x,i)=>sum+x*[.2126,.7152,.0722][i],0);
 for(const family of Object.values(data.families))for(const theme of['light','dark']){const[a,b]=[luminance(family[theme].background),luminance(family[theme].foreground)].sort((a,b)=>a-b);assert((b+.05)/(a+.05)>=4.5);}
});
test('unrecognised new tasks do not invent an objective',()=>assert.equal(learningGoalFor({mode:'unknown',exerciseId:'unknown'}),undefined));
test('published source learning content is unchanged',()=>{for(const[file,hash]of Object.entries(JSON.parse(readFileSync('docs/learning-goals-20261101/integrated-baseline.json')).files)){if(file==='data/klink-production-index.json'){const old=execFileSync('git',['show','86ef96a12e8b90a19dccaa56e1711240a39dc4c5:'+file]);assert.equal(createHash('sha256').update(old).digest('hex'),hash);const before=JSON.parse(old),current=JSON.parse(readFileSync(file));assert.deepEqual(current.slice(0,before.length),before);assert.equal(current.length,before.length+4);}else assert.equal(createHash('sha256').update(readBeforeLocalInstructionCorrections(file)).digest('hex'),hash,file);}});
