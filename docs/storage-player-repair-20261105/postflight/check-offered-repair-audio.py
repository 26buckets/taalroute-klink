import json,pathlib,subprocess,tempfile,hashlib
root=pathlib.Path('docs/storage-player-repair-20261105');out=pathlib.Path('../publication-checks/live-repair-audio');out.mkdir(exist_ok=True);rows=[]
for entry in json.loads((root/'local/audio-metadata-repairs.json').read_text()):
 p=entry['file'];b=subprocess.check_output(['curl','-fsS','--retry','2','--max-time','45','https://klink.taalroute.nl/'+p.removeprefix('public/')]);assert b==pathlib.Path(p).read_bytes(),p
 target=out/pathlib.Path(p).name;target.write_bytes(b)
 info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format_tags','-of','json',str(target)]));tags={k.lower():v for k,v in info['format']['tags'].items()}
 for key in ['artist','album_artist','publisher']:assert tags[key]=='Taalroute',(p,key)
 assert 'taalroute' in tags['album'].lower() or 'klink' in tags['album'].lower()
 assert not any(x in json.dumps(tags).lower() for x in ['suno','elevenlabs','generator','openai'])
 decoded=subprocess.check_output(['ffmpeg','-v','error','-i',str(target),'-map','0:a:0','-f','hash','-hash','sha256','-']).decode().strip().split('=')[1]
 assert decoded==entry['audioSha256'],p
 rows.append(dict(file=p,sha256=hashlib.sha256(b).hexdigest(),decodedAudioSha256=decoded,metadataPassed=True,exactBytes=True,originalSoundPreserved=True))
(out/'checks.json').write_text(json.dumps(rows,indent=2)+'\n');print('PASS',len(rows),'live recordings, branding, exact bytes and original sound')
