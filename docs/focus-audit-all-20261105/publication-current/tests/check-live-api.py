import base64,concurrent.futures,hashlib,json,subprocess
from pathlib import Path
assets=json.loads(Path('data/klink-grammar-aa-assets.json').read_text())
def check(item):
 name,entry=item;expected=base64.b64decode(entry['body']);url='https://klink.taalroute.nl/api/grammar-aa-assets/'+name
 body=subprocess.check_output(['curl','-fsS','--retry','2','--max-time','45',url]);assert body==expected,name
 head=subprocess.check_output(['curl','-fsSI','--max-time','45',url]).decode().lower();assert 'content-length: '+str(len(body)) in head,name
 part=subprocess.check_output(['curl','-fsS','--max-time','45','-H','Range: bytes=0-31',url]);assert part==body[:32],name
 return dict(file=name,bytes=len(body),sha256=hashlib.sha256(body).hexdigest(),exactBytes=True,head=True,range=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:rows=list(pool.map(check,assets.items()))
assert len(rows)==len(assets)==81
Path('docs/focus-audit-all-20261105/postflight/live-api.json').write_text(json.dumps(rows,indent=2)+'\n');print('PASS',len(rows),'live API payloads, exact bytes, HEAD and range')
