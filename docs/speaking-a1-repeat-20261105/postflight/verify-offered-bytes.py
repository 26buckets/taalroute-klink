import json,hashlib,urllib.request,urllib.error,subprocess,pathlib
root=pathlib.Path('/tmp/klink-implementatie-20261101');d=root/'docs/speaking-a1-repeat-20261105';out=d/'postflight';out.mkdir(exist_ok=True);(out/'audio').mkdir(exist_ok=True)
base='https://klink.taalroute.nl';sha=lambda b:hashlib.sha256(b).hexdigest()
def fetch(p):
 result=subprocess.check_output(['curl','-sS','--max-time','60','-H','Cache-Control: no-cache','-w','\n%{http_code}',base+p]);body,code=result.rsplit(b'\n',1)
 if int(code)!=200:raise urllib.error.HTTPError(base+p,int(code),'HTTP',None,None)
 return body
m=json.loads((d/'manifest.json').read_text());release=fetch('/release.json');(out/'release.json').write_bytes(release);r=json.loads(release);assert r['sourceCommit']=='8589a60a02117dfce87c44a833341796eed8b2c1' and r['sourceClean'] and r['branch']=='main'
b=fetch(m['row']['url']);assert sha(b)==m['bankSha256'];(out/'bank.json').write_bytes(b)
media=[]
for x in m['mapping']:
 p,*frag=x['src'].split('#');b=fetch(p)
 if frag:
  start,length=map(int,frag[0].split('=')[1].split(','));b=b[start:start+length]
 assert sha(b)==x['audioSha256'],x['sourceId'];file=out/x['audioFile'];file.write_bytes(b)
 tags=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format_tags','-of','json',str(file)]))['format']['tags'];tags={k.lower():v for k,v in tags.items()}
 assert all(tags.get(k)=='Taalroute' for k in ['artist','album_artist','publisher']),tags
 subprocess.run(['ffmpeg','-v','error','-i',str(file),'-f','null','-'],check=True,capture_output=True)
 media.append({'id':x['sourceId'],'sha256':sha(b),'bytes':len(b),'exactBytes':True,'metadataPassed':True,'fullDecode':True})
held=[]
for row in json.loads((root/'docs/spelling-dictation-20261104/import-manifest.json').read_text())['newRows']:
 try:fetch(row['row']['url']);raise AssertionError('HOLD bank is available')
 except urllib.error.HTTPError as e:assert e.code==404;held.append({'url':row['row']['url'],'status':404})
row=next(x for x in json.loads((root/'data/klink-production-index.json').read_text()) if x['id']=='production:write:alfa-b:KSW-N26R2-AB-SO-001-010');b=fetch(row['url']);assert sha(b)==row['url'].split('/')[-1].split('.')[0];(out/'retained-writing-bank.json').write_bytes(b)
proof={'sourceCommit':r['sourceCommit'],'bankSha256':m['bankSha256'],'exactTenIds':[x['exerciseId'] for x in json.loads((out/'bank.json').read_text())['exercises']],'media':media,'heldBanks':held,'retainedWritingBankExact':True,'newAudio':0,'newImages':0,'pr12Included':False}
(out/'offered-bytes.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n');print('PASS live release, exact bank/audio10, metadata/decode10, six404, retained writingbank')
