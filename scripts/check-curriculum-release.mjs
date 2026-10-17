import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { klinkContexts } from '../lib/klink-context.ts';
const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const readiness = read('../data/klink-release-readiness.json');
const media = read('../data/klink-media.json');
const release = read('../data/klink-curriculum.json');
const instructions = read('../data/klink-instructions.json');
const comprehensionAudio = read('../data/klink-comprehension-audio.json');
const issues = [];
if (!readiness.publicationApproved) issues.push('De nieuwe inhoud is nog niet vrijgegeven.');
if (!readiness.baseline.commitToLiveVersionProven) issues.push('De broncommit van de liveversie moet nog aantoonbaar worden bevestigd.');
try {
  const proof = JSON.parse(readFileSync(readiness.baseline.proofFile));
  if (proof.sourceCommit !== readiness.baseline.sourceCommit || proof.liveWorkerVersion !== readiness.baseline.liveWorkerVersion || proof.sourceCommitDocumented !== true || !/^[a-f0-9]{64}$/.test(proof.originalArchiveSha256) || !/^[a-f0-9]{64}$/.test(proof.freshClientSha256)) {
    issues.push('Het herkomstbewijs past niet bij de vastgezette publicatiebasis.');
  }
} catch { issues.push('Het onderliggende herkomstbewijs ontbreekt of is onleesbaar.'); }
if (execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim() !== readiness.canonicalBranch) issues.push('Publiceer uitsluitend vanuit de canonieke branch.');
execFileSync('git', ['merge-base', '--is-ancestor', readiness.baseline.sourceCommit, 'HEAD']);
if (readiness.wordPronunciationReview !== 'approved') issues.push('De uitspraakcontrole staat open.');
if (readiness.imageMeaningReview !== 'approved') issues.push('De woord-beeldcontrole staat open.');
if (readiness.instructionAudioCoverage !== 'complete') issues.push('Niet elke oefenvorm heeft gecontroleerde instructie-audio.');
const missingInstructions = instructions.items.filter(item => !item.src);
if (missingInstructions.length) issues.push(`${missingInstructions.length} instructieopnamen moeten nog worden geproduceerd.`);
if (instructions.voiceId === instructions.targetVoiceId) issues.push('De instructiestem moet verschillen van de doeltaalstem.');
if (instructions.humanReview !== 'approved') issues.push('De instructie-audio is nog niet inhoudelijk vrijgegeven.');
if (readiness.sentenceComprehensionReview !== 'approved' || comprehensionAudio.humanReview !== 'approved') issues.push('De begripsvragen en bijbehorende vraag-, hulp- en antwoordaudio wachten op menselijke vrijgave.');
if (comprehensionAudio.instructionVoiceId === comprehensionAudio.targetVoiceId) issues.push('Vraag- en steunstem moeten verschillen van de doeltaalstem.');
if (klinkContexts.some(item => item.humanReview !== 'approved')) issues.push('De zinnen en situaties wachten op inhoudelijke en luistervrijgave.');
const missing = release.words.filter(word => !media[word.id]?.audio);
if (missing.length) issues.push(`${missing.length} betekenissen hebben nog geen gekoppelde woordopname.`);
const missingImages = release.words.filter(word => !media[word.id]?.image);
if (missingImages.length) issues.push(`${missingImages.length} betekenissen hebben nog geen gekoppeld betekenisbeeld.`);
if (issues.length) { console.error(issues.join('\n')); process.exitCode = 1; }
else {
  execFileSync(process.execPath, ['scripts/check-klink-media-files.mjs'], { stdio: 'inherit' });
  console.log('Publicatiebasis en inhoudelijke vrijgave gecontroleerd.');
}
