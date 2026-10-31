import {readFileSync as read, writeFileSync as write, existsSync, mkdirSync} from 'node:fs';
import {execFileSync as exec} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const dir='docs/imported-alfa-c-release-20261031',plan=JSON.parse(read(dir+'/audio-plan.json'));
mkdirSync(dir+'/originals',{recursive:true});
const key=read('/Users/nicoknoester/Documents/Taalroute-muziek-audio/.env','utf8').match(/^ELEVENLABS_API_KEY\s*=\s*(.+)$/m)?.[1].trim().replace(/^['"]|['"]$/g,'');
assert(key);const headers={'xi-api-key':key,'Content-Type':'application/json'};
const sha=b=>createHash('sha256').update(b).digest('hex');
const packets=f=>exec('ffmpeg',['-v','error','-i',f,'-map','0:a:0','-c:a','copy','-f','hash','-hash','sha256','-'],{encoding:'utf8'}).trim();
const save=(p,x)=>write(p,JSON.stringify(x,null,2)+'\n');
const sub=await fetch('https://api.elevenlabs.io/v1/user/subscription',{headers});assert(sub.ok);const credits=await sub.json();
const chars=plan.clips.reduce((n,x)=>n+x.text.length,0);assert(plan.clips.length===5&&chars<1600);assert(credits.character_limit-credits.character_count>chars*2);
mkdirSync('public/package-audio/leesherstel-20261031',{recursive:true});
for(const c of plan.clips){
 assert.equal(c.voiceId===plan.instructionVoiceId,c.role==='guide');const record=dir+'/'+c.id+'.json';
 if(existsSync(record)){const old=JSON.parse(read(record));assert.equal(old.status,'candidate');assert.equal(old.text,c.text);assert.equal(old.voiceId,c.voiceId);assert.equal(sha(read('public'+old.src)),old.sha256);continue;}
 const src='/package-audio/leesherstel-20261031/'+c.id+'.mp3',original=dir+'/originals/'+c.id+'.mp3';
 save(record,{...c,status:'request-started'});
 const res=await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${c.voiceId}?output_format=mp3_44100_128`,{method:'POST',headers,body:JSON.stringify({text:c.text,model_id:c.model??plan.model,language_code:'nl',apply_text_normalization:'off',voice_settings:plan.settings,seed:31}),signal:AbortSignal.timeout(60000)});
 assert(res.ok,'Speech request failed '+res.status+'; inspect before retry');const bytes=Buffer.from(await res.arrayBuffer());assert(bytes.length>1000);write(original,bytes);
 const meta={artist:'Taalroute',album_artist:'Taalroute',publisher:'Taalroute',album:'Klink - Taalroute',title:c.text,copyright:'Taalroute'};
 exec('ffmpeg',['-v','error','-n','-i',original,'-map_metadata','-1','-c:a','copy',...Object.entries(meta).flatMap(([k,v])=>['-metadata',k+'='+v]),'-metadata','encoder=','public'+src]);
 assert.equal(packets(original),packets('public'+src));const probe=JSON.parse(exec('ffprobe',['-v','error','-show_format','-of','json','public'+src]));
 for(const [k,v]of Object.entries(meta))assert.equal(probe.format.tags[k],v);
 save(record,{...c,src,status:'candidate',model:c.model??plan.model,settings:plan.settings,sha256:sha(read('public'+src)),originalSha256:sha(bytes),metadata:probe.format.tags,duration:Number(probe.format.duration),metadataVerified:true,audioPacketsUnchanged:true,humanListeningReview:'open',requestId:res.headers.get('request-id'),historyItemId:res.headers.get('history-item-id')});
 console.log(c.id+': generated and metadata verified');
}
