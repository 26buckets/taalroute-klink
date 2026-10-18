import { readFileSync, writeFileSync, existsSync, realpathSync, mkdirSync } from 'node:fs';
import { resolve, relative, isAbsolute, dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { candidateItemIssues, sanitizeImportedItem, importedDomains } from '../lib/imported-practice-contract.ts';
import {adaptReleaseItem} from './adapt-release-item.mjs';
export const contentHash = value => createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value)).digest('hex');
function evidence(workdir, path) {
  if (typeof path !== 'string' || isAbsolute(path)) throw Error('Reviewbewijs moet een relatief bestandspad zijn.');
  const root = realpathSync(workdir), file = realpathSync(resolve(root,path));
  if (relative(root,file).startsWith('..') || isAbsolute(relative(root,file))) throw Error('Reviewbewijs ligt buiten de werkmap.');
  const bytes = readFileSync(file); if (!bytes.length) throw Error('Reviewbewijs is leeg.');
  return {path,sha256:contentHash(bytes)};
}
export function inspectReleaseCandidate(workdir, domain, admission) {
  const path=join(workdir,'release-candidate.json');
  const result={domain,path,status:'missing',candidateSha256:null,admitted:[],excluded:[],reviewEvidence:[],sourcePatches:[],queueSummary:null,limitations:[],pendingClassificationItems:[]};
  if(!existsSync(path)) return result;
  try {
    const bytes=readFileSync(path);result.candidateSha256=contentHash(bytes);
    const candidate=JSON.parse(bytes);result.status='inspected';
    if(candidate.schemaVersion!==1 || candidate.domain!==domain || !importedDomains.includes(domain) || !Array.isArray(candidate.items) || candidate.finalizationId!==`regie-20261018-finalize-${domain}`) throw Error('Kandidaatcontract, domein of eindopdracht komt niet overeen.');
    if(!candidate.queueSummary || !['completed','blocked','remaining'].every(key=>Array.isArray(candidate.queueSummary[key]))) throw Error('Eindige wachtrijverantwoording ontbreekt.');
    if(!Array.isArray(candidate.sourcePatches))throw Error('Bronpatchregister ontbreekt.');
    result.queueSummary=candidate.queueSummary;result.sourcePatches=candidate.sourcePatches??[];result.limitations=candidate.limitations??[];
    result.pendingClassificationItems=candidate.pendingClassificationItems??[];
    const seen=new Map();for(const item of candidate.items) seen.set(item.id,(seen.get(item.id)??0)+1);
    for(const item of candidate.items) {
      const adapted=adaptReleaseItem(item,domain);
      const issues=[...adapted.issues,...candidateItemIssues(adapted.item)];
      if (['presentationPolicy','stimulusDelivery','taskDefinition','designDetail','fields','dependsOnItemIds'].some(field => Array.isArray(adapted.item[field]) ? adapted.item[field].length > 0 : Boolean(adapted.item[field]))) issues.push('Aanvullende uitvoerings-, veld- of afhankelijkheidsvoorwaarden moeten eerst expliciet aangesloten worden.');
      if(seen.get(item.id)!==1) issues.push('Dubbele item-ID in kandidaat.');
      const proof=admission?.items?.find(row=>row.id===item.id);
      if(admission?.candidateSha256!==result.candidateSha256 || !proof || proof.itemSha256!==contentHash(item) || proof.responseReviewed!==true || proof.preparationReviewed!==true || proof.levelReviewed!==true) issues.push('Bron-, antwoord-, voorbereiding- of niveaureview is niet aan deze exacte versie gekoppeld.');
      if(adapted.item.teacherWorkflow&&proof?.renderedItemSha256!==contentHash(sanitizeImportedItem(adapted.item,domain)))issues.push('De specifieke cursist-/docentweergave is niet aan deze exacte omzetting gekoppeld.');
      if(result.sourcePatches.length && !['not-required','verified-separate-source'].includes(proof?.sourcePatchDisposition)) issues.push('Bronpatchafhankelijkheid is nog niet afzonderlijk gecontroleerd.');
      const references=[];
      for(const ref of Array.isArray(item.reviewEvidence)?item.reviewEvidence:[]) {try{references.push(evidence(workdir,ref));}catch(error){issues.push(error.message);}}
      if(!issues.length) {
        result.admitted.push(sanitizeImportedItem(adapted.item,domain));
        result.reviewEvidence.push({id:item.id,itemSha256:contentHash(item),files:references});
      } else result.excluded.push({id:item.id??null,issues:[...new Set(issues)]});
    }
    return result;
  } catch(error) {result.status='invalid';result.error=error.message;result.admitted=[];return result;}
}
function taskIdentity(item) {
  const compare = (a,b) => a < b ? -1 : a > b ? 1 : 0;
  const correct = item.mode === 'choice' ? item.options.filter(option => item.correctOptionIds.includes(option.id)).map(option => option.text).sort(compare) : [...item.acceptedAnswers].sort(compare);
  return contentHash({mode:item.mode,prompt:item.prompt,stimulus:item.stimulus,options:item.options.map(option=>option.text).sort(compare),correct,teacherGuidance:item.mode==='teacher'?item.teacherGuidance:undefined});
}
export function inspectRegisteredCandidates(registry,admissions={}) {
  const domains=registry.threads.map(row=>inspectReleaseCandidate(row.workdir,row.domain,admissions[row.domain]));
  const ids=new Map(),tasks=new Map();for(const domain of domains)for(const item of domain.admitted){ids.set(item.id,(ids.get(item.id)??0)+1);const key=taskIdentity(item);tasks.set(key,(tasks.get(key)??0)+1);}
  for(const domain of domains)domain.admitted=domain.admitted.filter(item=>{if(ids.get(item.id)===1&&tasks.get(taskIdentity(item))===1)return true;domain.excluded.push({id:item.id,issues:['Dubbele item-ID of dezelfde volledige opdracht onder verschillende IDs.']});return false;});
  return {schemaVersion:1,domains,items:domains.flatMap(domain=>domain.admitted)};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const option=(flag,fallback)=>process.argv.includes(flag)?process.argv[process.argv.indexOf(flag)+1]:fallback;
  const root=resolve(import.meta.dirname,'..');
  const registry=JSON.parse(readFileSync(option('--registry','/Users/nicoknoester/Documents/Codex/2026-10-18/klink-productieregie/registry.json')));
  const admissionPath=option('--admissions',join(root,'outputs/content-integration-20261018/admissions.json'));
  const result=inspectRegisteredCandidates(registry,existsSync(admissionPath)?JSON.parse(readFileSync(admissionPath)):{});
  const report=join(root,'outputs/content-integration-20261018/import-report.json');mkdirSync(dirname(report),{recursive:true});writeFileSync(report,JSON.stringify(result,null,2)+'\n');
  if(process.argv.includes('--write')) {
    const target=join(root,'data/klink-imported-practice.json');
    // Never discard previously integrated items because a producer is temporarily missing or revising its export.
    const previous=JSON.parse(readFileSync(target));const nextIds=new Set(result.items.map(item=>item.id));
    const removed=previous.items.filter(item=>!nextIds.has(item.id));
    if(removed.length)throw Error(`Import would remove ${removed.length} existing items; resolve the source review first.`);
    writeFileSync(target,JSON.stringify({schemaVersion:1,items:result.items},null,2)+'\n');
  }
  console.log(JSON.stringify(result.domains.map(domain=>({domain:domain.domain,status:domain.status,admitted:domain.admitted.length,excluded:domain.excluded.length,error:domain.error,remaining:domain.queueSummary?.remaining.length})),null,2));
}
