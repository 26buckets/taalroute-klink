import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {verifyGrammarPublication} from './check-grammar-publication-20261101.mjs';
import {verifyAlfaCSentencesRelease} from './check-klink10-sentences-alfa-c-release.mjs';
assert(verifyGrammarPublication().twentyWordAudio);
const root='docs/klink10-sentences-alfa-c-20261103/',owner='docs/klink-owner-release-ten-sentences-alfa-c-20261103.json',cases=[[owner,{publicationApproved:false}],[root+'backup.json',{fullReadback:false}],[root+'nico-alstublieft-goedkeuring.json',{humanApproved:false}]];
for(const[file,patch]of cases){const x=JSON.parse(readFileSync(file));assert.throws(()=>verifyAlfaCSentencesRelease(p=>p===file?Buffer.from(JSON.stringify({...x,...patch})):readFileSync(p)));}
writeFileSync(root+'local/release-tests.json',JSON.stringify({parentGatePassed:true,negativeProofCases:cases.length},null,2)+'\n');console.log('Full release chain and three refused-release cases passed.');
