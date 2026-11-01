import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const folder='docs/synonym-context-20261101',plan=JSON.parse(readFileSync(folder+'/voice-plan.json'));
const originalFolder='/Users/nicoknoester/.cache/klink-synonym-context-20261101/originals';
const sha=b=>createHash('sha256').update(b).digest('hex');
const packets=f=>execFileSync('ffmpeg',['-v','error','-i',f,'-map','0:a:0','-c:a','copy','-f','hash','-hash','sha256','-'],{encoding:'utf8'}).trim();
assert.equal(plan.provider,'ElevenLabs');assert.equal(plan.newRecordings.length,3);
const key=readFileSync('/Users/nicoknoester/Documents/Taalroute-muziek-audio/.env','utf8').match(/^ELEVENLABS_API_KEY\s*=\s*(.+)$/m)?.[1].trim().replace(/^['"]|['"]$/g,'');assert(key);
const headers={'xi-api-key':key,'Content-Type':'application/json'};
const subscription=await fetch('https://api.elevenlabs.io/v1/user/subscription',{headers});assert(subscription.ok,'ElevenLabs account unavailable: '+subscription.status);const before=await subscription.json();
assert(before.character_limit-before.character_count>plan.newRecordings.reduce((n,c)=>n+c.text.length+1,0)*2,'Insufficient existing ElevenLabs credits');
const records=existsSync(folder+'/audio.json')?JSON.parse(readFileSync(folder+'/audio.json')):[];
mkdirSync(originalFolder,{recursive:true});mkdirSync('public/package-audio/synoniemen-context-20261101',{recursive:true});
for(const clip of plan.newRecordings){
 assert.notEqual(clip.voiceId,plan.instructionVoiceId);const existing=records.find(x=>x.id===clip.id);
 if(existing){assert.equal(sha(readFileSync('public'+clip.src)),existing.sha256);continue;}
 const original=originalFolder+'/'+clip.id+'.mp3',src='public'+clip.src;
 assert(!existsSync(src),'Do not overwrite an existing delivery');
 let requestId=null,historyItemId=null;
 if(!existsSync(original)){
  const res=await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${clip.voiceId}?output_format=mp3_44100_128`,{method:'POST',headers,body:JSON.stringify({text:clip.text+'.',model_id:plan.model,language_code:'nl',apply_text_normalization:'off',voice_settings:plan.settings,seed:1}),signal:AbortSignal.timeout(60000)});
  assert(res.ok,'ElevenLabs conversion failed: '+res.status);const bytes=Buffer.from(await res.arrayBuffer());assert(bytes.length>1000);writeFileSync(original,bytes);requestId=res.headers.get('request-id');historyItemId=res.headers.get('history-item-id');
 }
 const metadata={artist:'Taalroute',album_artist:'Taalroute',publisher:'Taalroute',album:'Klink - Synoniemen',title:clip.text,copyright:'Taalroute'};
 execFileSync('ffmpeg',['-v','error','-n','-i',original,'-map_metadata','-1','-c:a','copy',...Object.entries(metadata).flatMap(([k,v])=>['-metadata',k+'='+v]),'-metadata','encoder=',src]);
 assert.equal(packets(original),packets(src));const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_format','-of','json',src]));for(const[k,v]of Object.entries(metadata))assert.equal(probe.format.tags[k],v);
 records.push({...clip,provider:plan.provider,model:plan.model,settings:plan.settings,sourceText:clip.text+'.',originalSha256:sha(readFileSync(original)),sha256:sha(readFileSync(src)),audioPacketHash:packets(src),audioPacketsUnchanged:true,metadataVerified:true,metadata:probe.format.tags,duration:Number(probe.format.duration),humanListeningReview:'open',requestId,historyItemId,newCreditPurchase:false,originalBackupPath:original});
 writeFileSync(folder+'/audio.json',JSON.stringify(records,null,2)+'\n');
 console.log(JSON.stringify({text:clip.text,provider:plan.provider,duration:Number(probe.format.duration),metadataVerified:true}));
}
const bindings=JSON.parse(readFileSync('data/klink-synonym-audio.json'));
for(const c of records){const id='synonym-word:'+c.text;assert(!bindings[id]||bindings[id].src===c.src);bindings[id]={src:c.src,transcript:c.text,voiceId:c.voiceId,role:'target',review:'approved',metadataApproved:true,humanReview:'open'};}
writeFileSync('data/klink-synonym-audio.json',JSON.stringify(bindings,null,2)+'\n');
