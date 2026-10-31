import assert from 'node:assert/strict';
import {readFileSync as read} from 'node:fs';
import {verifyImportedAlfaCRelease as verify} from '../../scripts/check-imported-alfa-c-release-20261031.mjs';
const auth='docs/klink-owner-release-imported-alfa-c-20261031.json',folder='docs/imported-alfa-c-release-20261031/';
const mutate=(path,change)=>file=>file===path?Buffer.from(change(read(file).toString())):read(file);
const json=change=>text=>{const value=JSON.parse(text);change(value);return JSON.stringify(value);};
verify();
const cases=[
 ['approval',auth,json(v=>v.publicationApproved=false)],
 ['scope',auth,json(v=>v.changedFiles.push('package.json'))],
 ['linked content','data/klink-alfa-c-functioneel.json',s=>s+' '],
 ['audio file','public/package-audio/leesherstel-20261031/guide-947ccbc2020e.mp3',s=>s+'x'],
 ['voice evidence',folder+'audio.json',json(v=>v[0].voiceId='wrong')],
 ['local checks',folder+'verification.json',json(v=>v.browser=false)],
 ['backup',folder+'backup.json',json(v=>v.files['lib/practice-chapters.ts']='wrong')],
];
for(const[label,path,change]of cases)assert.throws(()=>verify(mutate(path,change)),undefined,label);
console.log('PASS release proof and',cases.length,'negative mutation checks');
