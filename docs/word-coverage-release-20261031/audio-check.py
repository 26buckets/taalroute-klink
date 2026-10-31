import json,pathlib,subprocess,concurrent.futures,hashlib
D=pathlib.Path('docs/word-coverage-release-20261031');urls=set()
def walk(x):
 if isinstance(x,dict):
  for k,v in x.items():
   if k in ['src','audio']and isinstance(v,str)and v.startswith('/package-audio/'):urls.add(v)
   else:walk(v)
 elif isinstance(x,list):
  for v in x:walk(v)
for row in json.load(open(D/'banks.json')):walk(json.load(open('public'+row['url'])))
walk(json.load(open('data/klink-meaning-contexts.json')))
def check(src):
 p=pathlib.Path('public'+src);assert p.exists(),src
 d=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-of','json',str(p)]))['format'];assert float(d.get('duration',0))>0
 tags={k.lower():v for k,v in d.get('tags',{}).items()};brand=tags.get('artist')=='Taalroute'and tags.get('album_artist',tags.get('albumartist','Taalroute'if p.suffix=='.wav'else''))=='Taalroute'
 assert tags.get('publisher')=='Taalroute',src
 assert not any(w in json.dumps(tags).lower()for w in ['elevenlabs','suno','openai','generator']),src
 subprocess.run(['ffmpeg','-v','error','-i',str(p),'-f','null','-'],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
 return{'src':src,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'duration':float(d['duration']),'tags':tags,'metadataValid':brand,'decodes':True}
with concurrent.futures.ThreadPoolExecutor(max_workers=8)as pool:items=list(pool.map(check,sorted(urls)))
(D/'audio-check.json').write_text(json.dumps(items,indent=2)+'\n');print({'files':len(items),'metadataProblems':[i['src']for i in items if not i['metadataValid']]})
