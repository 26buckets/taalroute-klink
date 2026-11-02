import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

export const wordListeningBase = '1bdd9ac0a7ec02bb7027ac3211648ef414b00b42';
const live = '7d1adc5192d265e50362833d5bbbfe2e3c10dacc';
const folder = 'docs/word-listening-20261101/';
const roots = ['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
const git = (...args) => execFileSync('git',args,{maxBuffer:128e6});
const lines = bytes => bytes.toString().trim().split('\n').filter(Boolean);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const sort = values => values.sort((a,b)=>a.localeCompare(b));
const tagSize = bytes => bytes.reduce((n,b)=>n*128+b,0);

export function checkedWordMp3(bytes, word, expectedPayload) {
  assert.equal(bytes.subarray(0,6).toString('hex'),'494433040000');
  const end = 10 + tagSize(bytes.subarray(6,10));
  assert(end < bytes.length);
  const tags = {};
  for (let at=10;at<end;) {
    assert(at+10 <= end);
    const key=bytes.subarray(at,at+4).toString(), size=tagSize(bytes.subarray(at+4,at+8));
    assert(size>0 && at+10+size<=end && bytes[at+10]===3);
    tags[key]=bytes.subarray(at+11,at+10+size).toString('utf8');
    at+=10+size;
  }
  for (const key of ['TPE1','TPE2','TPUB','TCOP']) assert.equal(tags[key],'Taalroute');
  assert.equal(tags.TALB,'Klink - Woorden beluisteren');assert.equal(tags.TIT2,word);
  assert.equal(sha(bytes.subarray(end)),expectedPayload,'Unchanged MPEG sound data');
}

export function verifyWordListeningRelease(read=readFileSync) {
  const json=file=>JSON.parse(read(file));
  const r=json('docs/klink-owner-release-word-listening-20261101.json');
  assert.equal(r.approvedBy,'Nico');assert(r.publicationApproved&&r.layoutAndStylePreserved&&r.wordListeningOutlineRemoved&&r.progressPreserved);
  assert.equal(r.evidenceKind,'standing-owner-approval');assert.equal(r.baselineSourceCommit,wordListeningBase);assert.equal(r.liveSourceCommit,live);
  assert(r.userRequest.includes('alle woorden afzonderlijk aanklikbaar voor audio')&&r.userRequest.includes('Behoud de selectie'));
  assert(r.publicationRequest.includes('Publiceer gecontroleerde batches'));
  const policy=json('docs/klink-invullen-20261101/automatic-owner-approval.json');assert(policy.automaticOwnerApproval&&policy.automaticPublicationApproval&&!policy.mayInventHumanReviewEvidence&&!policy.mayBypassPublicationGate);
  git('merge-base','--is-ancestor',live,wordListeningBase);git('merge-base','--is-ancestor',wordListeningBase,'HEAD');
  const changed=sort([...new Set([...lines(git('diff','--name-only',wordListeningBase,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])]);
  assert.deepEqual(changed,r.changedFiles);assert.deepEqual(sort(Object.keys(r.files)),changed);
  for (const [file,hash] of Object.entries({...r.files,...r.evidenceFiles})) assert.equal(sha(read(file)),hash,file);
  const wordCss='components/product/word-audio-text.css';
  assert(changed.every(file=>(!file.endsWith('.css')||file===wordCss)&&!file.startsWith('db/')&&!file.startsWith('drizzle/')),'Only the requested word outline may change');
  assert.equal(read(wordCss).toString(),git('show',wordListeningBase+':'+wordCss).toString().replace('box-shadow: none;','box-shadow: none; outline: none !important;'));
  const floor='docs/appearance-floor-20261031/floor.json',approval='docs/appearance-floor-20261031/approved-updates/word-listening-20261101.json';
  const beforeFloor=JSON.parse(git('show',wordListeningBase+':'+floor));
  assert.deepEqual(json(floor),{...beforeFloor,approvedUpdates:[...beforeFloor.approvedUpdates,approval]});
  const border=json(approval);assert(border.appearanceChangeApproved&&border.publicationApproved&&!border.layoutChanged&&!border.referenceImagesChanged);
  assert(border.userRequest.includes('zonder selectierand')&&border.userRequest.includes('Behoud de selectie'));
  for(const [file,hash] of Object.entries(border.files))assert.equal(sha(read(file)),hash,file);
  assert(!lines(git('diff','--name-only','--diff-filter=D',wordListeningBase,'--','public')).length,'Existing media retained');
  for(const file of changed.filter(file=>file.startsWith('public/'))) assert(file.startsWith('public/package-audio/word-listening-20261101/')&&!lines(git('ls-tree','-r','--name-only',wordListeningBase,'--',file)).length,'Only new audio assets');
  const registry=json('data/klink-word-listening-audio.json'),manifest=json(folder+'audio-manifest.json');
  assert.equal(Object.keys(registry).length,5651);assert.equal(manifest.records.length,5651);
  const records=new Map(manifest.records.map(row=>[row.word,row])), bundles=new Map();let packed=0,waves=0;
  for(const [word,row] of Object.entries(registry)) {
    assert.equal(row.transcript,word);assert.equal(row.role,'target');assert(row.technicalApproved&&row.metadataApproved);
    assert(['0qLmDzgqulxcvv0yf3kg','7qdUFMklKPaaAVMsBTBt'].includes(row.voiceId));
    assert.equal(row.humanPronunciationReview,'not performed; owner standing approval');
    const proof=records.get(word);assert.equal(proof.sha256,row.sha256);assert.equal(proof.voiceId,row.voiceId);
    if(typeof row.source==='string') { assert(['pit','pijn','ei'].includes(word));assert.equal(sha(read('public'+row.source)),row.sha256);waves++;continue; }
    const {src,offset,length}=row.source;
    assert(/^\/package-audio\/word-listening-20261101\/words-[a-f0-9]{16}\.bin$/.test(src));
    assert(Number.isSafeInteger(offset)&&offset>=0&&Number.isSafeInteger(length)&&length>=10&&length<=262144);
    if(!bundles.has(src)) bundles.set(src,{bytes:read('public'+src),ranges:[]});
    const bundle=bundles.get(src),bytes=bundle.bytes.subarray(offset,offset+length);
    assert.equal(bytes.length,length);assert.equal(sha(bytes),row.sha256);
    checkedWordMp3(bytes,word,proof.mpegPayloadSha256);bundle.ranges.push({offset,length});packed++;
  }
  assert.equal(packed,5648);assert.equal(waves,3);assert.equal(bundles.size,53);
  for(const {bytes,ranges} of bundles.values()) { let end=0;for(const row of ranges.sort((a,b)=>a.offset-b.offset)){assert.equal(row.offset,end,'No unused or overlapping candidate bytes');end+=row.length;}assert.equal(end,bytes.length);assert(bytes.length<=2*1024*1024); }
  const source=json(folder+'local/source-coverage.json');assert.equal(source.exerciseIds,68057);assert.deepEqual(source.missing,[]);
  const rendered=json(folder+'local/rendered-coverage.json');assert.equal(rendered.pages,143);assert.deepEqual(rendered.errors,[]);assert.deepEqual(rendered.missing,[]);
  const browser=json(folder+'local/word-browser.json');assert.equal(browser.checks.length,44);assert.deepEqual(browser.errors,[]);
  const appearance=json(folder+'local/appearance.json');assert.equal(appearance.checks.length,24);assert.deepEqual(appearance.errors,[]);assert(appearance.checks.every(row=>row.pixelIdentical));
  const space=json(folder+'local/space-native.json');assert.equal(space.checks.length,4);assert.deepEqual(space.errors,[]);
  const recorder=json(folder+'local/recorder.json');assert.equal(recorder.checks.length,13);assert.deepEqual(recorder.errors,[]);
  const v=json(folder+'verification.json');for(const key of ['types','lint','unit','sourceCoverage','nativeAudio','answerSelection','recording','appearance','existingContentRetained','normalBuild','localOnly']) assert.equal(v[key],true,key);
  assert(v.staticAssetFiles<20000&&v.includedCreditUpperBound<=60000&&v.paidBudget===0);
  const backup=json(folder+'backup.json');assert(backup.verified&&backup.fullReadback&&backup.zipIntegrity&&backup.driveId);assert.deepEqual(backup.files,r.files);assert.deepEqual(backup.evidenceFiles,r.evidenceFiles);
  return r;
}

export function readBeforeWordListening(file,r,read=readFileSync) {return r.changedFiles.includes(file)?git('show',wordListeningBase+':'+file):read(file);}
