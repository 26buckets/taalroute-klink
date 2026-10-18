import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {contentHash,inspectRegisteredCandidates} from './import-release-candidates.mjs';
import {adaptReleaseItem} from './adapt-release-item.mjs';
import {candidateItemIssues,sanitizeImportedItem} from '../lib/imported-practice-contract.ts';
const registry=JSON.parse(readFileSync('/Users/nicoknoester/Documents/Codex/2026-10-18/klink-productieregie/registry.json'));
const out=resolve('outputs/cumulative-integration-20261018');mkdirSync(out,{recursive:true});
const admissions={},audit=[];
for(const entry of registry.threads){
 const bytes=readFileSync(join(entry.workdir,'release-candidate.json'));const candidate=JSON.parse(bytes);
 const admitted=[];const records=[];const evidenceCache=new Map();
 for(const raw of candidate.items){
  const {item,issues}=adaptReleaseItem(raw,entry.domain);
  const reasons=[...issues,...candidateItemIssues(item)];
  if(['presentationPolicy','stimulusDelivery','taskDefinition','designDetail','fields','dependsOnItemIds','displayPolicy','renderingContract'].some(key=>Array.isArray(item[key])?item[key].length:Boolean(item[key])))reasons.push('Niet aangesloten uitvoeringsvoorwaarden.');
  const files=[];
  for(const path of raw.reviewEvidence){
   if(!evidenceCache.has(path)){
    const file=join(entry.workdir,path);
    if(!existsSync(file))evidenceCache.set(path,{path,missing:true});
    else {const data=readFileSync(file);evidenceCache.set(path,{path,sha256:contentHash(data),bytes:data.length});}
   }
   const file=evidenceCache.get(path);files.push(file);if(file.missing||!file.bytes)reasons.push('Ontbrekend of leeg reviewbewijs: '+path);
  }
  if(raw.id==='klink-sp-c-01-pennen')reasons.push('De zin “Ik leg de penen klaar” is ook correct voor wortelen. De cursistzin legt pennen niet vast; eerst brongebonden betekeniscontrast herstellen.');
  if(raw.sourceIds.includes('klink-woord-chauffeur')&&JSON.stringify(raw).includes('voorafgaande klinker blijft kort'))reasons.push('De onjuiste klinkerregel bij chauffeur is nog afhankelijk van afzonderlijk bronherstel.');
  if(raw.teacherExpected?.repairs){
   let corrected=raw.stimulus;for(const repair of raw.teacherExpected.repairs){if(!corrected.includes(repair.before))reasons.push('Spellingherstel niet teruggevonden in exacte bron.');corrected=corrected.replaceAll(repair.before,repair.after);}
   if(corrected!==raw.teacherExpected.correctText)reasons.push('Spellingherstel wijzigt meer dan de vastgelegde verschillen.');
  }
  if(entry.domain==='woordpakketten'&&item.teacherWorkflow){
   const steps=raw.phases??raw.legacyOriginal?.phases;
   if(steps)for(const step of steps){const projected=item.teacherWorkflow.phases.find(p=>p.id===step.id);const expected=step.learnerSurface??[...(step.visibleWords??[]),...(step.visibleGraphemes??[])];if(JSON.stringify(projected?.learnerText)!==JSON.stringify(expected))reasons.push('Cursistfase wijkt af van exact producentoppervlak.');}
   if(raw.semanticFollowup&&!item.teacherWorkflow.phases.some(p=>p.id==='semantic'&&p.learnerText.length===0))reasons.push('Betekeniscontrole ontbreekt.');
  }
  const normalized=sanitizeImportedItem(item,entry.domain);
  const record={id:raw.id,itemSha256:contentHash(raw),renderedItemSha256:contentHash(normalized),decision:reasons.length?'excluded':'admitted',reasons:[...new Set(reasons)],reviewBasis:'Exacte bron-/antwoord-/voorbereidings-/niveaudossiers van producent, brongebonden projectiecontrole en centrale uitzonderingen; geen menselijke beoordeling of individuele vrijgave.',sourceIds:raw.sourceIds,level:raw.level,axis:raw.axis,levelInterpretation:raw.levelInterpretation??raw.levelStatus??'Ontwerpcel; geen behaald individueel niveau.',responseReference:raw.teacherExpected??raw.teacherReference??raw.modelAnswer??raw.expectedResponse??raw.correctOptionIds,preparationSha256:contentHash(raw.prerequisites),projectedPreparationSha256:contentHash(item.prerequisites),visiblePhases:item.teacherWorkflow?.phases.map(p=>({id:p.id,response:p.response,learnerText:p.learnerText,interlude:Boolean(p.interlude),correction:p.correction})),evidence:files,countCategory:raw.countCategory??'source-task',sourcePatchDisposition:'not-required'};
  records.push(record);
  if(!reasons.length)admitted.push({id:raw.id,itemSha256:record.itemSha256,renderedItemSha256:record.renderedItemSha256,responseReviewed:true,preparationReviewed:true,levelReviewed:true,sourcePatchDisposition:'not-required',centralEvidence:`${entry.domain}-item-review.json`});
 }
 admissions[entry.domain]={candidateSha256:contentHash(bytes),items:admitted};
 const evidence=[...evidenceCache.values()];
 writeFileSync(join(out,`${entry.domain}-item-review.json`),JSON.stringify({candidateSha256:contentHash(bytes),producerDirectory:entry.workdir,producerState:JSON.parse(readFileSync(join(entry.workdir,'production-state.json'))),producerDriveVerification:candidate.driveVerification,pendingClassificationItems:candidate.pendingClassificationItems??[],sourcePatches:candidate.sourcePatches,records},null,2)+'\n');
 audit.push({domain:entry.domain,total:candidate.items.length,pending:candidate.pendingClassificationItems?.length??0,admitted:admitted.length,excluded:records.filter(r=>r.decision==='excluded').map(r=>({id:r.id,reasons:r.reasons})),evidenceFiles:evidence.length,missingEvidence:evidence.filter(r=>r.missing).length});
}
writeFileSync(join(out,'admissions.json'),JSON.stringify(admissions,null,2)+'\n');
const result=inspectRegisteredCandidates(registry,admissions);
writeFileSync(join(out,'import-report.json'),JSON.stringify(result,null,2)+'\n');
writeFileSync(join(out,'review-summary.json'),JSON.stringify(audit,null,2)+'\n');
console.log(JSON.stringify(result.domains.map(r=>({domain:r.domain,admitted:r.admitted.length,excluded:r.excluded.length,error:r.error,unexpected:r.excluded.filter(e=>!audit.find(a=>a.domain===r.domain).excluded.some(x=>x.id===e.id))})),null,2));
if(process.argv.includes('--write')){const previous=JSON.parse(readFileSync('data/klink-imported-practice.json'));if(previous.items.some(item=>!result.items.some(next=>next.id===item.id)))throw Error('Existing imported items would be removed.');writeFileSync('data/klink-imported-practice.json',JSON.stringify({schemaVersion:1,items:result.items},null,2)+'\n');}
