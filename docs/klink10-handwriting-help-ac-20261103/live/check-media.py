import json,pathlib,subprocess,hashlib,datetime
p=pathlib.Path('/private/tmp/klink-handwriting-live-20261103');r=pathlib.Path('/private/tmp/klink-publish-20261103-96bd');items=json.loads((pathlib.Path('/Users/nicoknoester/Documents/Codex/2026-10-29/ok-voor-klink-staan-een-heel/outputs/KLINK-tien-publicatie-20261102/handwriting-ac-20261103')/'selected-items.json').read_text());d=p/'offered-audio';d.mkdir(exist_ok=True)
files={x['canonical']['prompt']['audio']['src']:'target' for x in items}
for x in items:files[x['canonical']['instructionAudio']['src']]='instruction'
checks=[]
for src,role in files.items():
 f=d/pathlib.Path(src).name;subprocess.run(['curl','-fsSL','https://klink.taalroute.nl'+src,'-o',str(f)],check=True);b=f.read_bytes();assert b==(r/('public'+src)).read_bytes()
 probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(f)]));tags=probe['format']['tags']
 for k in ['artist','album_artist','publisher']:assert tags.get(k)=='Taalroute',(src,k,tags)
 assert 'Taalroute' in tags.get('album','') or tags.get('album') in ['Klink - Woorden beluisteren','Klink Woordgebruik','Klink - Oefeninstructies']
 assert not any(s in json.dumps(tags).lower() for s in ['suno','elevenlabs','openai','gpt','generator'])
 pcm=subprocess.check_output(['ffmpeg','-v','error','-i',str(f),'-map','0:a:0','-f','s16le','-acodec','pcm_s16le','-']);assert len(pcm)>1000
 checks.append(dict(src=src,role=role,bytes=len(b),sha256=hashlib.sha256(b).hexdigest(),offeredBytesEqual=True,metadata=tags,duration=float(probe['format']['duration']),decodedPcmSha256=hashlib.sha256(pcm).hexdigest()))
assert len(checks)==11
(p/'media.json').write_text(json.dumps(dict(checkedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),checks=checks,newAudio=0,offeredBytesAndMetadataPassed=True,humanListeningPerformed=False),ensure_ascii=False,indent=2)+'\n')
subprocess.run(['curl','-fsSL','https://klink.taalroute.nl/release.json','-o',str(p/'live-release.json')],check=True)
print('11 offered files byte-identical, metadata checked and decoded; release downloaded.')
