import hashlib,json,os,pathlib,subprocess,tempfile
d=pathlib.Path('docs/spelling-dictation-20261104')
base=os.environ.get('KLINK_TEST_BASE','http://127.0.0.1:19042')
out=pathlib.Path(os.environ.get('KLINK_TEST_OUTPUT','/tmp/klink-spelling-b1-browser'))
p=json.loads((d/'media-reuse-proof.json').read_text())
sha=lambda b:hashlib.sha256(b).hexdigest()
checked=[]
with tempfile.TemporaryDirectory() as tmp:
 for key,path,h in [('instruction',p['instruction']['src'],None)]+[(x['sourceId'],x['source'],x['sha256']) for x in p['sourceRecordings']]:
  canonical=pathlib.Path('public'+path).read_bytes()
  if h: assert sha(canonical)==h
  b=subprocess.check_output(['curl','-fsS','--max-time','25',base+path]);assert b==canonical
  file=pathlib.Path(tmp)/('recording'+pathlib.Path(path).suffix);file.write_bytes(b)
  tags=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format_tags','-of','json',str(file)]))['format']['tags']
  tags={k.lower():v for k,v in tags.items()}
  assert all(tags[k]=='Taalroute' for k in ('artist','album_artist','publisher')),key
  pcm=subprocess.check_output(['ffmpeg','-v','error','-i',str(file),'-f','s16le','-acodec','pcm_s16le','-']);assert len(pcm)>0
  checked.append(dict(id=key,src=path,sha256=sha(b),pcmSha256=sha(pcm),metadata=tags))
assert len(checked)==37
out.mkdir(parents=True,exist_ok=True);(out/'media.json').write_text(json.dumps(dict(base=base,checks=checked,humanListeningPerformed=False),ensure_ascii=False,indent=2)+'\n')
print('37 existing recordings: full bytes, decode and brand tags checked.')
