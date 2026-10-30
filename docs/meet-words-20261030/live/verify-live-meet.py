import json,pathlib,urllib.request,hashlib,concurrent.futures,subprocess,tempfile,time
root=pathlib.Path('.');report=json.load(open('docs/meet-words-20261030/content.json'));index=json.load(open('data/klink-production-index.json'));rows=[r for r in index if r['id'].startswith('word-meet:')];urls=set(report['audio']+report['images']+[r['url'] for r in rows]+['/klink-oefenoverzicht-luisteren-20261030.html'])
urls.update('/'+str(p.relative_to('dist/client')) for p in pathlib.Path('dist/client/_next/static').rglob('*') if p.suffix in ['.js','.css'])
out=pathlib.Path('work/live');out.mkdir(parents=True,exist_ok=True)
release=json.loads(subprocess.check_output(['curl','-fsSL','https://klink.taalroute.nl/release.json']));commit=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip();assert release['sourceCommit']==commit;assert release['sourceClean'] and release['branch']=='main'
def check(url):
 for attempt in range(3):
  try:
   raw=subprocess.check_output(['curl','-fsSL','--max-time','45','https://klink.taalroute.nl'+url]);break
  except Exception:
   if attempt==2:raise
   time.sleep(1)
 local=pathlib.Path('public'+url) if not url.startswith('/_next/') else pathlib.Path('dist/client'+url)
 assert hashlib.sha256(raw).digest()==hashlib.sha256(local.read_bytes()).digest(),url
 if url in report['audio']:
  with tempfile.NamedTemporaryFile(suffix='.mp3') as f:
   f.write(raw);f.flush();meta=json.loads(subprocess.check_output(['ffprobe','-v','quiet','-show_format','-of','json',f.name]));tags=meta['format']['tags'];assert tags['artist']=='Taalroute' and tags['album_artist']=='Taalroute';assert float(meta['format']['duration'])>0
 return dict(url=url,bytes=len(raw),sha256=hashlib.sha256(raw).hexdigest(),audioMetadata=url in report['audio'])
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool: assets=list(pool.map(check,sorted(urls)))
(out/'assets.json').write_text(json.dumps(assets,indent=2));(out/'release.json').write_text(json.dumps(release,indent=2));print('PASS live',len(assets),'files byte-identical,',len(report['audio']),'audio metadata checks')
