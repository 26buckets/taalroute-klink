import pathlib,subprocess,json,hashlib,concurrent.futures,os
D=pathlib.Path('docs/word-meanings-release-20261031');base='https://klink.taalroute.nl';sha=lambda b:hashlib.sha256(b).hexdigest();auth=json.load(open('docs/klink-owner-release-word-meanings-20261031.json'))
def get(path):return subprocess.check_output(['curl','-fsSL','--retry','2','--max-time','40',base+path])
release=json.loads(get('/release.json'));assert release['sourceCommit']==os.environ['KLINK_EXPECTED_COMMIT'];assert release['branch']=='main' and release['sourceClean']
files=[f for f in auth['changedFiles']if f.startswith('public/')];checks=[]
def check(f):
 b=get('/'+f.removeprefix('public/'));assert sha(b)==auth['files'][f],f;return{'file':f,'sha256':sha(b),'bytes':len(b)}
with concurrent.futures.ThreadPoolExecutor(max_workers=8)as pool:checks=list(pool.map(check,files))
(D/'live-audio').mkdir(exist_ok=True);audio=[]
for c in json.load(open(D/'audio.json')):
 b=get(c['src']);assert sha(b)==c['sha256'];p=D/'live-audio'/(c['id']+'.mp3');p.write_bytes(b);tags=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format_tags','-of','json',str(p)]))['format']['tags']
 for k in ['artist','album_artist','publisher']:assert tags[k]=='Taalroute'
 assert not any(x in json.dumps(tags).lower()for x in ['elevenlabs','suno','openai','generator']);audio.append({'id':c['id'],'sha256':sha(b),'metadataVerified':True,'tags':tags})
(D/'live-files.json').write_text(json.dumps({'release':release,'files':checks,'audio':audio,'allByteIdentical':True},indent=2)+'\n');print({'files':len(checks),'audioMetadata':len(audio),'sourceCommit':release['sourceCommit']})
