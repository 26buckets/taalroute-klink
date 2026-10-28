from pathlib import Path
import re,hashlib,json
w=Path(__file__).parent;old=w/'ux-tested-static';new=Path('/private/tmp/klink-alfa-c-release-g5faxwol/dist/client/_next/static')
def key(s):return re.sub(r'-[A-Za-z0-9_-]{8}(?=\.(?:js|css))','-BUILDHASH',s)
def collect(root):
 build=next(p.name for p in root.iterdir() if p.is_dir() and re.fullmatch(r'[a-f0-9-]{36}',p.name))
 return build,{key(p.relative_to(root).as_posix().replace(build,'BUILDID')):p for p in root.rglob('*') if p.is_file() and p.suffix in ['.js','.css']}
a,af=collect(old);b,bf=collect(new);assert af.keys()==bf.keys()
rows=[]
for k,p in af.items():
 x=p.read_text().replace(a,'BUILDID');y=bf[k].read_text().replace(b,'BUILDID')
 for f in af.values():x=x.replace(f.name,key(f.name))
 for f in bf.values():y=y.replace(f.name,key(f.name))
 if k == 'chunks/vinext-BUILDHASH.js':
  pattern=r'function (\w+)\(\)\{return \w+\(`([0-9a-f-]{32,36})`\)\}'
  old_ids=dict(re.findall(pattern,x));new_ids=dict(re.findall(pattern,y));assert old_ids.keys()==new_ids.keys() and len(old_ids)==2
  for name,value in old_ids.items():x=x.replace(value,'GENERATED_RSC_'+name)
  for name,value in new_ids.items():y=y.replace(value,'GENERATED_RSC_'+name)
 same=x==y;rows.append({'file':k,'equalAfterBuildIdentifiers':same,'testedSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'publishedSha256':hashlib.sha256(bf[k].read_bytes()).hexdigest()})
 if not same:
  (w/'bundle-before.txt').write_text(x);(w/'bundle-after.txt').write_text(y)
r={'testedBuildId':a,'publishedBuildId':b,'normalization':'Only generated build IDs, RSC compatibility/build identities and corresponding hashed JS/CSS filenames; no application content normalization. Vinext primary installed source: dist/config/next-config.js safeUUID/createRscCompatibilityId; dist/index.js lines 1399-1405 and 1467-1469.','files':rows,'allEquivalent':all(x['equalAfterBuildIdentifiers'] for x in rows)}
(w/'ux-bundle-comparison.json').write_text(json.dumps(r,indent=2)+'\n');print(json.dumps({'runtimeFiles':len(rows),'allEquivalent':r['allEquivalent'],'different':[x['file'] for x in rows if not x['equalAfterBuildIdentifiers']]}));assert r['allEquivalent']
