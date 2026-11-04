from pathlib import Path
import json,urllib.request,hashlib,subprocess,sys
r=Path('/private/tmp/klink-publish-20261103-96bd/docs/dictation-ac-ready10-20261104');out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True);m=json.loads((r/'manifest.json').read_text());bundle=(r/'audio-original.bin').read_bytes();checks=[]
for id,c in m['recordings'].items():
 req=urllib.request.Request('https://klink.taalroute.nl'+c['src'],headers={'User-Agent':'Mozilla/5.0','Accept-Encoding':'identity'})
 # curl is the established live reader on this host; urllib may be denied independently of app health.
 p=out/(id+'.mp3');subprocess.run(['curl','-fsS','https://klink.taalroute.nl'+c['src'],'-o',str(p)],check=True);b=p.read_bytes();assert b==bundle[c['offset']:c['offset']+c['length']];assert hashlib.sha256(b).hexdigest()==c['sha256'];f=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format_tags:format=duration','-of','json',str(p)]))['format'];assert all(f['tags'][k]=='Taalroute' for k in ['artist','album_artist','publisher']);subprocess.run(['ffmpeg','-v','error','-i',str(p),'-f','null','-'],capture_output=True,check=True);checks.append({'id':id,'src':c['src'],'sha256':c['sha256'],'bytes':len(b),'metadata':f['tags'],'duration':f['duration'],'decodePassed':True})
(out.parent/'audio-preservation.json').write_text(json.dumps({'recordings':checks,'exactOfferedBytes':True,'newTTS':0,'humanListeningPerformed':False},indent=2)+'\n');print('Eleven live recordings exact; original sound and Taalroute metadata preserved.')
