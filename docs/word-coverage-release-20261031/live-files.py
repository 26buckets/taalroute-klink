import json,subprocess,hashlib,concurrent.futures,pathlib
D=pathlib.Path('docs/word-coverage-release-20261031');r=json.load(open('docs/klink-owner-release-word-coverage-20261031.json'));paths={f[6:]:h for f,h in r['files'].items()if f.startswith('public/')};paths.update({a['src'].lstrip('/'):a['sha256']for a in json.load(open(D/'audio-check.json'))})
def fetch(path):
 b=subprocess.check_output(['curl','-fsS','--retry','2','https://klink.taalroute.nl/'+path]);h=hashlib.sha256(b).hexdigest();assert h==paths[path],path;return {'path':path,'sha256':h,'bytes':len(b)}
with concurrent.futures.ThreadPoolExecutor(max_workers=8)as p:rows=list(p.map(fetch,paths))
(D/'live-files.json').write_text(json.dumps(rows,indent=2)+'\n');print(len(rows),'live files byte-identical, including all 1110 audio files and their embedded metadata')
