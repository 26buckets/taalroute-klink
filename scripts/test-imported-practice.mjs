import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {candidateItemIssues,contentTaskIssues,gradeContentResponse,sanitizeImportedItem} from '../lib/imported-practice-contract.ts';
import {importedCollections,importedExercise,importedItems,importedActivities} from '../lib/imported-practice.ts';
import {contentHash,inspectReleaseCandidate,inspectRegisteredCandidates} from './import-release-candidates.mjs';
import {updateLearningReview} from '../lib/learning-review.ts';
const example={id:'synthetic-spelling-1',queueCellId:'synthetic-cell',level:'Alfa B',axis:'literacy',title:'Test van precies typen',objective:'Uitsluitend een technische test',sourceIds:['synthetic-source'],mode:'text',prompt:'Typ het woord precies over.',stimulus:'café',options:[],correctOptionIds:[],acceptedAnswers:['café'],feedback:{correct:'Dit is precies hetzelfde woord.',retry:'Kijk naar alle letters en het accent.'},teacherGuidance:'Testfixture: geen lesmateriaal. Controleer alle tekens.',prerequisites:['Bereid c, a, f en é voor.','Doe typen en controleren voor.'],audioRequired:false,audioStatus:'not-required',releaseMode:'teacher-supported',blockers:[],reviewEvidence:['review.txt']};
function directory(){const path=mkdtempSync(join(tmpdir(),'klink-import-test-'));writeFileSync(join(path,'review.txt'),'Synthetische testreview: niet gebruiken als echte inhoudsvrijgave.');return path;}
function candidate(path,items=[example],domain='spelling'){
 const value={schemaVersion:1,domain,finalizationId:`regie-20261018-finalize-${domain}`,items,queueSummary:{completed:['synthetic-cell'],blocked:[],remaining:[]},sourcePatches:[]};const raw=JSON.stringify(value);writeFileSync(join(path,'release-candidate.json'),raw);return {candidateSha256:contentHash(raw),items:items.map(item=>({id:item.id,itemSha256:contentHash(item),responseReviewed:true,preparationReviewed:true,levelReviewed:true}))};
}
test('Typed responses never discard capitalization, accents, punctuation or whitespace',()=>{
 assert.deepEqual(candidateItemIssues(example),[]);
 for(const input of ['Cafe','cafe','Café','café.','café ',' café','ca fé'])assert.equal(gradeContentResponse(example,input).correct,false,input);
 for(const input of ['café','cafe\u0301'])assert.equal(gradeContentResponse(example,input).correct,true,input);
 const alternative={...example,acceptedAnswers:['houd','hou']};assert.equal(gradeContentResponse(alternative,'hou').correct,true);assert.equal(gradeContentResponse(alternative,'houdt').correct,false);
});
test('Choice grading requires every authorized ID and rejects extras, duplicate IDs and incomplete answers',()=>{
 const task={...example,mode:'choice',options:[{id:'a',text:'A'},{id:'b',text:'B'},{id:'c',text:'C'}],correctOptionIds:['a','c'],acceptedAnswers:[]};assert.deepEqual(contentTaskIssues(task),[]);
 assert.equal(gradeContentResponse(task,['c','a']).correct,true);
 for(const input of [['a'],['a','a'],['a','b','c'],[],['x']])assert.equal(gradeContentResponse(task,input).correct,false);
 assert(contentTaskIssues({...task,options:[task.options[0],task.options[0]]}).length);
});
test('Teacher completion has no automatic correctness judgment and never enters mastery/review',()=>{
 const item=sanitizeImportedItem({...example,mode:'teacher',acceptedAnswers:[]},'spelling');assert.deepEqual(gradeContentResponse(item,'any response'),{assessment:'participation',correct:null});const exercise=importedExercise(item);assert.equal(exercise.assessment,'participation');assert.equal(exercise.reviewEligible,false);assert.equal(exercise.independentReading,false);
 const state={};assert.equal(updateLearningReview(state,{...exercise,correct:true,helpUsed:false,attempts:1}),state);
});
test('Missing audio, blockers, missing preparation, wrong axis and unrenderable sources are excluded',()=>{
 for(const patch of [{audioRequired:true},{audioRequired:undefined},{releaseMode:'blocked'},{blockers:['Media ontbreken']},{prerequisites:[]},{axis:'language'},{stimulus:'![bron](missing.png)'},{mode:'unknown'},{acceptedAnswers:[]}])assert(candidateItemIssues({...example,...patch}).length,JSON.stringify(patch));
 assert.equal(gradeContentResponse({...example,acceptedAnswers:[]},'word').assessment,'unavailable');
});
test('An exact candidate and item review is required; source changes invalidate earlier admission',()=>{
 const dir=directory();try{const proof=candidate(dir);assert.equal(inspectReleaseCandidate(dir,'spelling',proof).admitted.length,1);assert.equal(inspectReleaseCandidate(dir,'spelling').admitted.length,0);
 const changed={...example,acceptedAnswers:['cafe']};candidate(dir,[changed]);assert.equal(inspectReleaseCandidate(dir,'spelling',proof).admitted.length,0);
 const next=candidate(dir);next.items[0].levelReviewed=false;assert.equal(inspectReleaseCandidate(dir,'spelling',next).admitted.length,0);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('Missing or escaped evidence cannot be substituted by a filename or a release claim',()=>{
 const dir=directory();try{for(const ref of ['missing.txt','../outside-review.txt','/etc/hosts']){const item={...example,reviewEvidence:[ref]};const proof=candidate(dir,[item]);assert.equal(inspectReleaseCandidate(dir,'spelling',proof).admitted.length,0);}assert.equal(inspectReleaseCandidate(dir,'teksten').status,'invalid');}finally{rmSync(dir,{recursive:true,force:true});}
});
test('Producer-specific delivery and dependency rules are never silently flattened',()=>{
 const dir=directory();try{for(const patch of [{presentationPolicy:{modelVisibility:'hidden'}},{stimulusDelivery:'Teacher only'},{taskDefinition:{settings:{inputModes:['paper']}}},{fields:[{label:'Naam'}]},{dependsOnItemIds:['prior-task']}]){const proof=candidate(dir,[{...example,...patch}]);assert.equal(inspectReleaseCandidate(dir,'spelling',proof).admitted.length,0);}}finally{rmSync(dir,{recursive:true,force:true});}
});
test('One blocked item does not suppress independently reviewed items; source patches stay separate',()=>{
 const dir=directory();try{const blocked={...example,id:'blocked',audioRequired:true};const proof=candidate(dir,[example,blocked]);const result=inspectReleaseCandidate(dir,'spelling',proof);assert.equal(result.admitted.length,1);assert.equal(result.excluded.length,1);
 const value=JSON.parse(readFileSync(join(dir,'release-candidate.json')));value.sourcePatches=[{id:'separate-source-patch'}];writeFileSync(join(dir,'release-candidate.json'),JSON.stringify(value));proof.candidateSha256=contentHash(JSON.stringify(value));assert.equal(inspectReleaseCandidate(dir,'spelling',proof).admitted.length,0);proof.items[0].sourcePatchDisposition='not-required';assert.equal(inspectReleaseCandidate(dir,'spelling',proof).admitted.length,1);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('Duplicate item identities are rejected within and across domains',()=>{
 const one=directory(),two=directory();try{let proof=candidate(one,[example,example]);assert.equal(inspectReleaseCandidate(one,'spelling',proof).admitted.length,0);proof=candidate(one);const other=candidate(two,[example],'woordpakketten');const result=inspectRegisteredCandidates({threads:[{workdir:one,domain:'spelling'},{workdir:two,domain:'woordpakketten'}]},{spelling:proof,woordpakketten:other});assert.equal(result.items.length,0);}finally{rmSync(one,{recursive:true,force:true});rmSync(two,{recursive:true,force:true});}
});
test('Public items retain response and preparation, but never private dossier paths or automatic reading release',()=>{
 const item=sanitizeImportedItem({...example,releaseMode:'independent',privateNote:'internal',reviewEvidence:['private-review.txt']},'spelling');assert(!('reviewEvidence'in item));assert(!('privateNote'in item));assert(!('releaseMode'in item));assert.deepEqual(item.acceptedAnswers,example.acceptedAnswers);assert.deepEqual(item.prerequisites,example.prerequisites);
 const collection=importedCollections('content-spelling',[item])[0];assert.equal(collection.exercises[0].access,'teacher-supported');assert.equal(collection.level,'alfa-b');assert.equal(collection.pack.words.length,0);assert.equal(collection.pack.media.audioAvailable,0);
 assert(importedItems.every(item=>!item.id.startsWith('synthetic-')));assert(importedActivities.every(route=>importedItems.some(item=>item.domain===route.domain)));
});
test('Additional presentation and media contracts cannot be silently dropped',()=>{
 for(const patch of [{sourceAudio:[{src:'recording.wav'}]},{presentationContract:{stimulusVisibility:'teacher-only-during-recall'}},{materials:{tiles:['a','b']}},{normalization:'ignore-case'}])assert(candidateItemIssues({...example,...patch}).length);
 assert.deepEqual(candidateItemIssues({...example,sourceAudio:[]}),[]);
});
test('Teacher choices retain their reference without becoming automatic correctness',()=>{
 const task={...example,mode:'teacher',acceptedAnswers:[],options:[{id:'a',text:'café'},{id:'b',text:'cafe'}],teacherReference:{correctOptionIds:['a'],acceptedAnswers:['café'],evidence:[{quote:'café'}],requiredSemanticSlots:[],meaningCheck:'Wijs het accent aan.',automaticCorrectness:false,showOnlyAfterInitialResponses:true}};
 assert.deepEqual(candidateItemIssues(task),[]);assert.equal(gradeContentResponse(task,['b']).correct,null);assert.deepEqual(sanitizeImportedItem(task,'spelling').teacherReference,task.teacherReference);
 assert(contentTaskIssues({...task,teacherReference:undefined}).length);assert(contentTaskIssues({...task,teacherReference:{...task.teacherReference,evidence:[{quote:'missing source'}]}}).length);
});
test('The same complete choice task is rejected even with renamed and reordered options',()=>{
 const one=directory(),two=directory();try{
 const task={...example,mode:'choice',acceptedAnswers:[],options:[{id:'a',text:'Ja'},{id:'b',text:'Nee'}],correctOptionIds:['a']};
 const duplicate={...task,id:'different-id',options:[{id:'no',text:'Nee'},{id:'yes',text:'Ja'}],correctOptionIds:['yes']};
 const result=inspectRegisteredCandidates({threads:[{workdir:one,domain:'spelling'},{workdir:two,domain:'woordpakketten'}]},{spelling:candidate(one,[task]),woordpakketten:candidate(two,[duplicate],'woordpakketten')});
 assert.equal(result.items.length,0);assert(result.domains.every(domain=>domain.excluded.length===1));
 }finally{rmSync(one,{recursive:true,force:true});rmSync(two,{recursive:true,force:true});}
});
