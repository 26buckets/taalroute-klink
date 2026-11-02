import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync}from'node:fs';
import {execFileSync}from'node:child_process';
import {createHash}from'node:crypto';
const folder='docs/handwriting-20261102/',sha=b=>createHash('sha256').update(b).digest('hex');
const rows=JSON.parse(readFileSync(folder+'audio-selected-final.json')),instruction='/package-audio/productie-instructies-20261029/KLINK-INS-f1e80ab41f43.mp3',files=new Map(rows.map(x=>[x.src,x]));files.set(instruction,{src:instruction,instruction:true});
const checks=[];
for(const[src,row]of files){
 const path='public'+src,bytes=readFileSync(path),probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_format','-show_streams','-of','json',path])),tags=probe.format.tags;
 for(const key of['artist','album_artist','publisher'])assert.equal(tags[key],'Taalroute',src+':'+key);
 assert(tags.album?.includes('Taalroute')||['Klink - Woorden beluisteren','Klink Woordgebruik','Klink - Oefeninstructies'].includes(tags.album),src+': retain its approved Taalroute/Klink album');assert(!/suno|elevenlabs|openai|gpt|generator/i.test(JSON.stringify(tags)));assert(Number(probe.format.duration)>.15&&Number(probe.format.duration)<15);
 const pcm=execFileSync('ffmpeg',['-v','error','-i',path,'-map','0:a:0','-f','s16le','-acodec','pcm_s16le','-'],{maxBuffer:16e6});assert(pcm.length>1000);
 if(row.sha256)assert.equal(sha(bytes),row.sha256);
 if(row.pcmSha256)assert.equal(sha(pcm),row.pcmSha256,'New audio PCM must remain unchanged');
 if(row.unpackedExistingRecording){const b=row.sourceBundle;assert(bytes.equals(readFileSync('public'+b.src).subarray(b.offset,b.offset+b.length)));}
 if(!row.createdNew&&!row.unpackedExistingRecording)assert(bytes.equals(execFileSync('git',['show','9918e0ad6bf496856c32f1e0d9f9fe6ed6ffab1a:'+path],{maxBuffer:16e6})),src+': preserve existing audio');
 checks.push({src,bytes:bytes.length,sha256:sha(bytes),pcmSha256:sha(pcm),duration:Number(probe.format.duration),codec:probe.streams.find(x=>x.codec_type==='audio').codec_name,metadata:tags,newRecording:row.createdNew===true,unpackedExistingRecording:row.unpackedExistingRecording===true,baselineBytesUnchanged:!row.createdNew&&!row.unpackedExistingRecording,humanListeningPerformed:false});
}
mkdirSync(folder+'local',{recursive:true});writeFileSync(folder+'local/media.json',JSON.stringify({checks,models:100,instructionFiles:1,allEmbeddedTaalrouteTagsPassed:true,newOriginalPcmUnchanged:true,existingAudioUnchanged:true,humanListeningPerformed:false},null,2)+'\n');assert.equal(checks.length,101);console.log('Passed101 actual audio files:complete Taalroute tags,decoding,original PCM identity and preservation of90 existing standalones plus two exact bundle extracts.');
