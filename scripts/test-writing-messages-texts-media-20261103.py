import hashlib,json,os,pathlib,subprocess,tempfile

base=os.environ.get('KLINK_TEST_BASE','http://127.0.0.1:19038')
out=pathlib.Path(os.environ.get('KLINK_TEST_OUTPUT','/tmp/klink-messages-texts-local'))
d=pathlib.Path('docs/writing-messages-texts-audio-fix-20261103')
a=json.loads((d/'audio-review.json').read_text())
sha=lambda data:hashlib.sha256(data).hexdigest()
packs={}
for b in a['bundles']:
 data=subprocess.check_output(['curl','-fsS',base+b['src']]);assert sha(data)==b['sha256'] and len(data)==b['bytes']<4*1024*1024
 packs[b['src']]=data
assert sha(b''.join(packs.values()))==a['supersededBundle']['sha256']
checks=[]
with tempfile.TemporaryDirectory() as tmp:
 p=pathlib.Path(tmp)/'clip.wav';headers=pathlib.Path(tmp)/'headers'
 for i,x in enumerate(a['selected']):
  packed=packs[x['source']['src']];url=base+x['source']['src']
  start=x['offset'];end=start+x['length']-1
  data=packed[start:end+1];assert len(data)==x['length'] and sha(data)==x['record']['sha256'];p.write_bytes(data)
  tags=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format_tags','-of','json',str(p)]))['format']['tags']
  assert tags==x['record']['metadata'] and all(tags[k]=='Taalroute' for k in ('artist','album_artist','publisher'))
  pcm=subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-f','s16le','-acodec','pcm_s16le','-'])
  assert sha(pcm)==x['record']['pcmSha256']
  status=None
  if i in {0,33,65,66,67,68,69}:
   body=subprocess.check_output(['curl','-fsS','-D',str(headers),'-H',f'Range: bytes={start}-{end}',url]);h=headers.read_text().lower()
   status=int(h.splitlines()[0].split()[1]);assert status in {200,206}
   if status==206:assert f'content-range: bytes {start}-{end}/{len(packed)}' in h and body==data
   else:assert body==packed
  checks.append(dict(word=x['word'],role=x['role'],sha256=sha(data),pcmSha256=sha(pcm),metadata=tags,sampledHTTPRangeStatus=status))
assert len(checks)==70
out.mkdir(parents=True,exist_ok=True)
(out/'media.json').write_text(json.dumps(dict(base=base,checks=checks,bundleSha256=[sha(x) for x in packs.values()]),indent=2)+'\n')
print('70 decoded WAV fragments with preserved Taalroute metadata; 7 HTTP range checks.')
