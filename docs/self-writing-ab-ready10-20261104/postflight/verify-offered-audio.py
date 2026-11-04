from pathlib import Path
import json,re,hashlib,subprocess
r=Path('/private/tmp/klink-self-writing-ab-ready10-20261104');e=r/'docs/self-writing-ab-ready10-20261104';p=e/'postflight';p.mkdir(exist_ok=True)
recordings=[]
for c in json.loads((e/'audio-preservation.json').read_text())['clips']:
 url,offset,length=re.fullmatch(r'(.+)#bytes=(\d+),(\d+)',c['src']).groups();offset=int(offset);length=int(length)
 file=p/Path(c['file']).name
 subprocess.run(['curl','-fsS','-H',f'Range: bytes={offset}-{offset+length-1}','-H','Accept-Encoding: identity','https://klink.taalroute.nl'+url,'-o',str(file)],check=True)
 data=file.read_bytes()
 if len(data)!=length:data=data[offset:offset+length];file.write_bytes(data)
 assert data==(r/c['file']).read_bytes() and hashlib.sha256(data).hexdigest()==c['sha256']
 tags=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-of','json',str(file)]))['format']['tags']
 for key in ['artist','album_artist','publisher']: assert tags[key]=='Taalroute'
 subprocess.run(['ffmpeg','-v','error','-i',str(file),'-f','null','-'],check=True)
 recordings.append({'src':c['src'],'sha256':c['sha256'],'bytes':length,'metadata':tags,'decodePassed':True,'exactOriginalBytes':True})
(p/'audio-preservation.json').write_text(json.dumps({'exactOfferedBytes':True,'recordings':recordings,'newTTS':0,'reencoding':False,'humanListeningPerformed':False},ensure_ascii=False,indent=2)+'\n')
print('One offered original instructions, embedded metadata and full decodes verified.')
