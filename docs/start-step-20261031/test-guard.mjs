import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {verifyStartStepRelease} from '../../scripts/check-start-step-release-20261031.mjs';
const owner='docs/klink-owner-release-start-step-20261031.json';
const tests=[['owner',owner,r=>({...r,approvedBy:'other'})],['appearance',owner,r=>({...r,appearanceChangeApproved:false})],['baseline',owner,r=>({...r,baselineSourceCommit:'0'.repeat(40)})],['scope',owner,r=>({...r,changedFiles:[...r.changedFiles,'app/globals.css']})],['backup','docs/start-step-20261031/backup.json',r=>({...r,verified:false})]];
verifyStartStepRelease();
for(const [name,file,change]of tests){const replacement=Buffer.from(JSON.stringify(change(JSON.parse(readFileSync(file)))));assert.throws(()=>verifyStartStepRelease(f=>f===file?replacement:readFileSync(f)),undefined,name);}
assert.throws(()=>verifyStartStepRelease(f=>f==='components/product/learner-app.tsx'?Buffer.concat([readFileSync(f),Buffer.from('\n')]):readFileSync(f)));
writeFileSync('docs/start-step-20261031/guard-results.json',JSON.stringify({currentScopeAccepted:true,rejections:6,passed:true},null,2)+'\n');console.log('PASS six scoped rejection checks');
