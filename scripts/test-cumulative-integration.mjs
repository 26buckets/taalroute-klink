import {contentRevisionCheckpoints} from './check-later-content-revisions.mjs';
import {readBeforeSentenceRevision} from './check-sentence-revision.mjs';
import {verifyContentAmendments,repairBaseline} from './check-content-repair-release.mjs';
import {execFileSync} from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {adaptReleaseItem} from './adapt-release-item.mjs';
import {contentHash} from './import-release-candidates.mjs';
import {importedItems,importedExercise,importedRoutes} from '../lib/imported-practice.ts';
import {contentTaskIssues} from '../lib/imported-practice-contract.ts';
import {groupExercises} from '../lib/group-practice.ts';
import {chapterCollections,chapterForLevel} from '../lib/practice-chapters.ts';
import {taalroutePackages} from '../lib/taalroute-packages.ts';
import {selectUsageExercises,defaultRouteSettings} from '../lib/learner-route.ts';
const registry=JSON.parse(readFileSync('/Users/nicoknoester/Documents/Codex/2026-10-18/klink-productieregie/registry.json'));
const candidates=Object.fromEntries(registry.threads.map(row=>[row.domain,JSON.parse(readFileSync(row.workdir+'/release-candidate.json'))]));
verifyContentAmendments(readBeforeSentenceRevision);
const originalItems=JSON.parse(execFileSync('git',['show',repairBaseline+':data/klink-imported-practice.json'],{maxBuffer:20e6})).items;
const admissions=JSON.parse(readFileSync('outputs/cumulative-integration-20261018/admissions.json'));
const currentBank=JSON.parse(readFileSync('data/klink-imported-practice.json')).items;
const selfUse=JSON.parse(readFileSync('data/klink-word-use-self.json'));
void test('Original admitted content matches exact final candidate and renderer hashes, with no audio or automatic teacher mastery',()=>{
 assert(currentBank.length>1300,'Real content must be integrated, not only an empty importer');
 assert.deepEqual(currentBank.map(item=>item.id),originalItems.map(item=>item.id));
 assert.deepEqual(importedItems,[...currentBank,...selfUse]);
 assert.equal(new Set(importedItems.map(item=>item.id)).size,importedItems.length);
 for(const row of registry.threads)assert.equal(contentHash(readFileSync(row.workdir+'/release-candidate.json')),admissions[row.domain].candidateSha256,'Producer changed; repeat source review');
 for(const item of currentBank){const raw=candidates[item.domain].items.find(row=>row.id===item.id);assert(raw);const proof=admissions[item.domain].items.find(row=>row.id===item.id);assert.equal(proof.itemSha256,contentHash(raw));assert.equal(proof.renderedItemSha256,contentHash(originalItems.find(x=>x.id===item.id)));assert.equal(raw.audioRequired,false);assert.equal(raw.blockers.length,0);assert.deepEqual(contentTaskIssues(item),[]);const exercise=importedExercise(item);assert.equal(exercise.reviewEligible,false);assert.equal(exercise.independentReading,false);assert.equal(exercise.requiresAudio,false);assert.equal(exercise.access,'teacher-supported');}
});
void test('Later approved self-practice questions retain exact content, source links and separate scoring',()=>{
 assert.deepEqual(selfUse,JSON.parse(execFileSync('git',['show',contentRevisionCheckpoints.approved+':data/klink-word-use-self.json'],{maxBuffer:20e6})));
 assert.equal(selfUse.length,42);
 for(const item of selfUse){
  assert(item.id.startsWith('self-use:'));assert(currentBank.some(source=>source.id===item.id.slice('self-use:'.length)));
  assert.deepEqual(contentTaskIssues(item),[]);const exercise=importedExercise(item);
  assert.equal(exercise.access,'self-practice');assert.equal(exercise.assessment,'answer');assert.equal(exercise.reviewEligible,false);assert.equal(exercise.independentReading,false);
  assert(!exercise.contentTask.teacherWorkflow&&!exercise.contentTask.teacherReference);
 }
});
void test('Every admitted item is reachable once in its chapter and in every source-linked canonical list',()=>{
 for(const route of importedRoutes){const expected=importedItems.filter(item=>item.domain===route.domain).map(item=>`content:${item.id}`).sort((a,b)=>a.localeCompare(b));const collections=chapterCollections(route.id);const actual=collections.flatMap(c=>c.exercises.map(e=>e.exerciseId));assert.deepEqual(actual.sort((a,b)=>a.localeCompare(b)),expected);}
 for(const pack of taalroutePackages)for(const route of importedRoutes){const exercises=groupExercises(pack,route.id);for(const item of exercises){assert.equal(item.componentId,'KLINK-CONTENT');assert(selectUsageExercises(exercises,pack,undefined,defaultRouteSettings,'guided').some(e=>e.exerciseId===item.exerciseId));}}
 for(const level of ['alfa-a','alfa-b','alfa-c','a1','a2','b1'])assert(chapterForLevel(level,'words'));
});
void test('Word surfaces exactly preserve all producer phases; semantic follow-up and delayed transitions cannot disappear',()=>{
 assert.equal(adaptReleaseItem(candidates.woordpakketten.items.find(item=>item.id==='klink-wp-final-sentence-2ca47fb1054b901e-functional-transfer'),'woordpakketten').item.teacherWorkflow.phases[0].response,'oral');
 assert.equal(adaptReleaseItem(candidates.woordpakketten.items.find(item=>item.id==='klink-wp-final-dialogue-17aa25708b6699a6-functional-transfer'),'woordpakketten').item.teacherWorkflow.phases[0].response,'paper');
 for(const raw of candidates.woordpakketten.items.filter(item=>!item.audioRequired)){
 const {item}=adaptReleaseItem(raw,'woordpakketten');const steps=raw.phases??raw.legacyOriginal?.phases;
 for(const step of steps??[]){const phase=item.teacherWorkflow.phases.find(row=>row.id===step.id);assert.deepEqual(phase.learnerText,step.learnerSurface??[...(step.visibleWords??[]),...(step.visibleGraphemes??[])]);if(step.id==='later-recall'||step.id==='final'&&raw.legacyOriginal?.transition)assert.equal(phase.interlude,true);}
 if(raw.semanticFollowup)assert(item.teacherWorkflow.phases.some(row=>row.id==='semantic'&&row.learnerText.length===0));
 }
});
void test('Writing retains four real forms, tiles, hidden models, numeric models and legible invalid old number',()=>{
 const item=id=>importedItems.find(row=>row.id===id);
 for(const id of ['08','11','12','13'])assert.equal(item(`klink-offline-schrijf-${id}`).teacherWorkflow.phases[0].response,'fields');
 const tiles=item('klink-sch-AA01-002-12').teacherWorkflow.phases[0];assert.equal(tiles.response,'tiles');assert.deepEqual([...tiles.tiles].sort((a,b)=>a.localeCompare(b)),['a','m','p']);
 const correction=item('regie-20261018-schrijven-005-SCH-AA-04-05').teacherWorkflow.phases[0];assert.deepEqual(correction.correction,{oldValue:'24',activeValue:'42'});
 for(const raw of candidates.schrijven.items.filter(row=>!row.audioRequired&&row.releaseMode!=='blocked')){const adapted=adaptReleaseItem(raw,'schrijven').item;const policy=raw.taskDefinition?.settings?.modelPolicy??raw.taskDefinition?.settings?.modelVisibility;if(['hidden','after-first-attempt'].includes(policy))assert.deepEqual(adapted.teacherWorkflow.phases[0].learnerText,[]);assert(adapted.teacherWorkflow.expected);}
});
void test('Ambiguous spelling, unrepaired chauffeur and all four unclassified texts remain excluded',()=>{
 assert(!importedItems.some(item=>item.id==='klink-sp-c-01-pennen'));
 for(const raw of candidates.teksten.pendingClassificationItems){assert.equal(raw.level,null);assert(!importedItems.some(item=>item.id===raw.id));}assert.equal(candidates.teksten.pendingClassificationItems.length,4);
 for(const raw of candidates.woordpakketten.items.filter(item=>item.sourceIds.includes('klink-woord-chauffeur')&&JSON.stringify(item).includes('voorafgaande klinker blijft kort')))assert(!importedItems.some(item=>item.id===raw.id));
});
void test('Broken phase, response and correction contracts are rejected',()=>{
 const source=importedItems.find(item=>item.teacherWorkflow?.phases[0].correction);for(const change of [item=>item.teacherWorkflow.phases.push(item.teacherWorkflow.phases[0]),item=>item.teacherWorkflow.phases[0].correction.activeValue='99',item=>item.teacherWorkflow.sourceHash='bad',item=>item.teacherWorkflow.phases[0].response='fields']){const item=structuredClone(source);change(item);assert(contentTaskIssues(item).length);}
});
void test('All questions for the same text are collected before any answer choices',()=>{
 for(const item of importedItems.filter(item=>item.teacherReference)){const questions=importedExercise(item).contentTask.initialQuestions;assert(questions.some(q=>q.id===item.id));assert.deepEqual(questions.map(q=>q.id),importedItems.filter(other=>other.teacherReference&&other.domain===item.domain&&other.stimulus===item.stimulus).map(other=>other.id));}
});
