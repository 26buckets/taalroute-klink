import {readFileSync as read, writeFileSync as write, existsSync, mkdirSync} from 'node:fs';
import {execFileSync as exec} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const dir='docs/klink10-speaking-20261102';
const phase=process.argv[2]??'';assert(['','b1','repair','repair2','repair3','repair4','words','word-sources','word-final','source-repair'].includes(phase));
const suffix=phase?'-'+phase:'';
const planBytes=read(dir+'/voice-plan'+suffix+'.json'),plan=JSON.parse(planBytes);
const key=read('/Users/nicoknoester/Documents/Taalroute-muziek-audio/.env','utf8').match(/^ELEVENLABS_API_KEY\s*=\s*(.+)$/m)?.[1].trim().replace(/^['"]|['"]$/g,'');
assert(key);
const headers={'xi-api-key':key,'Content-Type':'application/json'};
const sha=b=>createHash('sha256').update(b).digest('hex');
const save=(path,value)=>write(path,JSON.stringify(value,null,2)+'\n');
const packets=file=>exec('ffmpeg',['-v','error','-i',file,'-map','0:a:0','-c:a','copy','-f','hash','-hash','sha256','-'],{encoding:'utf8'}).trim();
const subscription=await fetch('https://api.elevenlabs.io/v1/user/subscription',{headers});
assert(subscription.ok,'Cannot verify included credits');
const credits=await subscription.json();
const characters=plan.clips.reduce((n,c)=>n+(c.requestText??c.text).length,0);
assert.equal(plan.characters,characters);assert(characters<plan.maximumIncludedCredits);
assert(credits.character_limit-credits.character_count>characters*2,'Not enough included credits; no paid overage');
mkdirSync(dir+'/originals',{recursive:true});mkdirSync(dir+'/recordings',{recursive:true});
mkdirSync('public/package-audio/klink10-speaking-20261102',{recursive:true});
const start=dir+'/generation-start'+suffix+'.json';
if(existsSync(start))assert.equal(JSON.parse(read(start)).planSha256,sha(planBytes));
else save(start,{startedAt:new Date().toISOString(),planSha256:sha(planBytes),includedLimit:credits.character_limit,includedUsedBefore:credits.character_count,characters,paidOverageAuthorized:false});
let cursor=0,completed=0;
async function worker(){
 while(cursor<plan.clips.length){
  const clip=plan.clips[cursor++],record=dir+'/recordings/'+clip.id+'.json';
  assert.equal(clip.voiceId,plan.roleVoices[clip.role]);assert.equal(sha(Buffer.from(clip.text)),clip.textSha256);
  if(existsSync(record)){
   const old=JSON.parse(read(record));
   assert.equal(old.status,'generated-and-verified','Uncertain request: inspect history before retrying '+clip.id);
   assert.equal(old.text,clip.text);assert.equal(old.voiceId,clip.voiceId);assert.equal(sha(read('public'+clip.src)),old.sha256);
   completed++;continue;
  }
  save(record,{...clip,status:'request-started',startedAt:new Date().toISOString()});
  const response=await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${clip.voiceId}?output_format=${plan.outputFormat}`,{
   method:'POST',headers,body:JSON.stringify({text:clip.requestText??clip.text,model_id:plan.model,language_code:'nl',apply_text_normalization:plan.textNormalization??'auto',voice_settings:plan.settings,seed:plan.seed??1}),signal:AbortSignal.timeout(90000)});
  if(!response.ok){save(record,{...clip,status:'request-failed',httpStatus:response.status});throw Error('Speech request failed '+clip.id+' HTTP '+response.status);}
  const bytes=Buffer.from(await response.arrayBuffer());assert(bytes.length>1000);
  const original=dir+'/originals/'+clip.id+'.mp3';write(original,bytes);
  const metadata={artist:'Taalroute',album_artist:'Taalroute',publisher:'Taalroute',album:'Klink - Taalroute',title:clip.title,copyright:'Taalroute'};
  exec('ffmpeg',['-v','error','-n','-i',original,'-map_metadata','-1','-c:a','copy',...Object.entries(metadata).flatMap(([k,v])=>['-metadata',k+'='+v]),'-metadata','encoder=','public'+clip.src]);
  const packetHash=packets(original);assert.equal(packets('public'+clip.src),packetHash);
  const probe=JSON.parse(exec('ffprobe',['-v','error','-show_format','-show_streams','-of','json','public'+clip.src]));
  for(const[k,v]of Object.entries(metadata))assert.equal(probe.format.tags[k],v);
  assert(Number(probe.format.duration)>0.5);assert.equal(probe.streams[0].sample_rate,'44100');
  exec('ffmpeg',['-v','error','-i','public'+clip.src,'-f','null','-']);
  save(record,{...clip,status:'generated-and-verified',generatedAt:new Date().toISOString(),model:plan.model,settings:plan.settings,sha256:sha(read('public'+clip.src)),originalSha256:sha(bytes),packetHash,audioPacketsUnchanged:true,metadata:probe.format.tags,metadataVerified:true,fullDecodeVerified:true,duration:Number(probe.format.duration),requestId:response.headers.get('request-id'),historyItemId:response.headers.get('history-item-id'),humanListeningReview:false});
  completed++;console.log(`${completed}/${plan.clips.length} ${clip.id}`);
 }
}
await Promise.all([worker(),worker()]);
const final=await fetch('https://api.elevenlabs.io/v1/user/subscription',{headers});assert(final.ok);
const after=await final.json();
save(dir+'/generation-complete'+suffix+'.json',{completedAt:new Date().toISOString(),planSha256:sha(planBytes),clips:completed,characters,includedUsedAfter:after.character_count,extraCreditsPurchased:false,humanListeningReview:false});
