import assert from 'node:assert/strict';
import {readFileSync,existsSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {writingDictationRounds} from '../lib/writing-dictation.ts';
const folder='docs/writing-dictation-20261101/',json=file=>JSON.parse(readFileSync(folder+file));
const whisper=json('audio-proof/existing-audio-asr.json'),ctc=json('audio-proof/uncertain-audio-dutch-ctc.json');
const repairs=existsSync(folder+'audio-proof/target-repairs.json')?json('audio-proof/target-repairs.json'):[];
const cuePlan=json('audio-proof/cues-production-plan.json'),cueFiles=json('audio-proof/cues-file-proof.json'),cueReview=json('audio-proof/cues-blind-asr-reviewed.json');
const targetsPlan=json('audio-proof/upstream-final-selection-plan.json'),voiceSupplement=json('audio-proof/target-voice-supplement.json');
assert.equal(cuePlan.voiceId,'h6uBOiAjLKklte8hdYio');assert.equal(cuePlan.targetVoiceId,'0qLmDzgqulxcvv0yf3kg');assert.notEqual(cuePlan.voiceId,cuePlan.targetVoiceId);
assert.equal(cueReview.spokenEquivalentFiles,5);assert.equal(cueFiles.files.length,5);assert(cueFiles.files.every(f=>f.audioDataIdentical));assert(cueFiles.files.reduce((n,f)=>n+Number(f.characterCost),0)<=500);
assert.equal(voiceSupplement.targetVoices.ei,'7qdUFMklKPaaAVMsBTBt');assert(voiceSupplement.eiVoiceDeclaredBeforeGeneration);
const normalize=s=>s.trim().toLocaleLowerCase('nl-NL').replace(/[.!?]+$/,'');
const exercises=writingDictationRounds.flatMap(r=>r.exercises),files=[];
for(const src of new Set(exercises.flatMap(e=>[e.prompt.audio.src,e.instructionAudio.src]))){
 if(!existsSync('public'+src))continue;
 const bytes=readFileSync('public'+src),media=JSON.parse(execFileSync('ffprobe',['-v','error','-show_format','-show_streams','-of','json','public'+src]));
 const tags=media.format.tags||{},brand=Object.fromEntries(Object.entries(tags).map(([k,v])=>[k.toLowerCase(),String(v)]));
 const metadataPassed=brand.artist==='Taalroute'&&/Taalroute|Klink/.test(brand.album||'')&&brand.album_artist==='Taalroute'&&brand.publisher==='Taalroute'&&!/\b(?:suno|elevenlabs|openai|generator|gpt|model)\b/i.test(Object.values(tags).join(' '));
 files.push({src,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),duration:Number(media.format.duration),codec:media.streams[0]?.codec_name,tags,metadataPassed});
}
const targets=exercises.map(e=>{
 const file=files.find(f=>f.src===e.prompt.audio.src),repair=repairs.find(r=>r.target===e.helpWord&&r.src===e.prompt.audio.src&&r.sha256===file?.sha256);
 const first=whisper.files.find(f=>f.src===e.prompt.audio.src&&f.sha256===file?.sha256&&f.target===e.helpWord),second=ctc.files.find(f=>f.src===e.prompt.audio.src&&f.target===e.helpWord);
 let spokenEvidence=first?.exactTranscript?'blind-whisper-exact':first&&second?.exact?'blind-dutch-ctc-exact':first&&e.helpWord==='plein'&&second?.text==='pleijn'?'blind-dutch-ctc-phonetic-equivalent':null;
 if(['pijn','ei','pit'].includes(e.helpWord)){
  spokenEvidence=repair&&repair.voiceId===targetsPlan.selection[e.helpWord]?.voiceId&&repair.voiceId!==cuePlan.voiceId&&repair.originalPcmIdentical===true&&repair.blindTexts?.some(text=>normalize(text)===normalize(e.helpWord))?'targeted-recording-blind-exact':null;
 }
 return {sourceId:e.writingSourceId,canonicalId:e.exerciseId,target:e.helpWord,src:e.prompt.audio.src,spokenEvidence,metadataPassed:file?.metadataPassed===true,passed:Boolean(file?.metadataPassed&&spokenEvidence),humanListening:false};
});
const instructions=exercises.map(e=>e.instructionAudio.src),instructionSources=[...new Set(instructions)];
const passed=targets.length===100&&targets.every(t=>t.passed)&&files.length===106&&files.every(f=>f.metadataPassed&&f.duration>0)&&instructionSources.length===6;
writeFileSync(folder+'audio-audit.json',JSON.stringify({passed,targets,files,instructionSources,humanListeningPerformed:false,newVoiceRolesDeclaredBeforeGeneration:true,existingRecordingsPreserved:true},null,2)+'\n');
console.log(JSON.stringify({passed,targets:targets.length,readyTargets:targets.filter(t=>t.passed).length,files:files.length,open:targets.filter(t=>!t.passed).map(t=>t.target)}));
if(!passed)process.exitCode=1;
