import{readFileSync as read,writeFileSync as write,existsSync}from'node:fs';import assert from'node:assert/strict';
const dir='docs/imported-alfa-c-release-20261031';
const key=read('/Users/nicoknoester/Documents/Taalroute-muziek-audio/.env','utf8').match(/^ELEVENLABS_API_KEY\s*=\s*(.+)$/m)?.[1].trim().replace(/^['"]|['"]$/g,'');assert(key);
for (const id of JSON.parse(read(dir+'/audio-plan.json')).clips.map(c=>c.id)) {
assert(!existsSync(dir+'/'+id+'-transcription-start.json'),'Inspect prior request before retry');
const clip=JSON.parse(read(dir+'/'+id+'.json'));
const form=new FormData();form.append('file',new Blob([read('public'+clip.src)],{type:'audio/mpeg'}),id+'.mp3');form.append('model_id','scribe_v2');form.append('language_code','nld');form.append('tag_audio_events','false');form.append('diarize','false');form.append('timestamps_granularity','word');
write(dir+'/'+id+'-transcription-start.json',JSON.stringify({startedAt:new Date().toISOString(),model:'scribe_v2',language:'nld'}));
const res=await fetch('https://api.elevenlabs.io/v1/speech-to-text',{method:'POST',headers:{'xi-api-key':key},body:form,signal:AbortSignal.timeout(180000)});const data=await res.json();write(dir+'/'+id+'-transcription.json',JSON.stringify(data,null,2));assert(res.ok,'Transcription failed '+res.status);console.log('Transcription received',data.words?.length,'tokens');

}
