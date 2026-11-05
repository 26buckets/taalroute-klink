import concurrent.futures,hashlib,json,pathlib,subprocess,tempfile,urllib.request,sys
repo=pathlib.Path(sys.argv[1]); out=pathlib.Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
sha=lambda b:hashlib.sha256(b).hexdigest()
base='https://klink.taalroute.nl'
assets=json.loads((repo/'data/klink-grammar-aa-assets.json').read_text())
media=json.loads((repo/'docs/dictation-50-20261105/media-50.json').read_text())
def get(url):
 return subprocess.check_output(['curl','-fsS','--retry','2','--max-time','40',url])
def asset_check(pair):
 key,a=pair;b=get(base+'/api/grammar-aa-assets/'+key);assert sha(b)==a['sha256'];return {'key':key,'sha256':sha(b),'bytes':len(b),'passed':True}
def media_check(c):
 b=get(c['url']);assert sha(b)==c['sha256'];p=out/(c['id']+pathlib.Path(c['url']).suffix);p.write_bytes(b)
 probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-of','json',str(p)]));tags={k.lower():v for k,v in probe['format'].get('tags',{}).items()};assert all(tags.get(k)=='Taalroute' for k in ['artist','album_artist','publisher']);assert 'Taalroute' in tags.get('album','')
 pcm=subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-f','s16le','-acodec','pcm_s16le','-']);assert sha(pcm)==c['pcmSha256']
 return {'id':c['id'],'sha256':sha(b),'pcmSha256':sha(pcm),'metadata':tags,'passed':True}
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
 a=list(pool.map(asset_check,assets.items()));m=list(pool.map(media_check,media))
p='/package-audio/productie-instructies-20261029/KLINK-INS-f1e80ab41f43.mp3';b=get(base+p);assert sha(b)=='c7689f211a34271e9acb367b444c48794e1bcbbd203150328d743154c174e664';(out/'instruction.mp3').write_bytes(b)
tags=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-of','json',str(out/'instruction.mp3')]))['format']['tags'];assert all(tags.get(k)=='Taalroute' for k in ['artist','album_artist','publisher'])
subprocess.check_call(['ffmpeg','-v','error','-i',str(out/'instruction.mp3'),'-f','null','-'])
release=json.loads(get(base+'/release.json'));head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo,text=True).strip();assert release['sourceCommit']==head and release['sourceClean'] and release['branch']=='main'
result={'liveRelease':release,'apiAssets':a,'media':m,'instructionSha256':sha(b),'instructionMetadata':tags,'humanListeningPerformed':False};(out/'checks.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps({'assets':len(a),'media':len(m),'instruction':True,'source':head,'passed':True}))
