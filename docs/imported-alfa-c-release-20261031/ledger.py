import json,pathlib,subprocess
D=pathlib.Path('docs/imported-alfa-c-release-20261031');baseline='711f12e908876e5a03ad23e10563358c7171f410';changes=[]
def diff(a,b,path):
 if a==b:return
 if isinstance(a,dict) and isinstance(b,dict) and a.keys()==b.keys():
  for k in a:diff(a[k],b[k],path+[k])
 elif isinstance(a,list) and isinstance(b,list) and len(a)==len(b):
  for i,(x,y) in enumerate(zip(a,b)):diff(x,y,path+[i])
 else:changes.append({'path':path,'before':a,'after':b})
for f in ['data/klink-imported-practice.json','data/klink-alfa-c-docent.json','data/klink-alfa-c-functioneel.json']:
 a=json.loads(subprocess.check_output(['git','show',baseline+':'+f]));b=json.load(open(f));diff(a,b,[f])
(D/'source-amendments.json').write_text(json.dumps({'baseline':baseline,'changes':changes},ensure_ascii=False,indent=2)+'\n')
print('Reversible field changes:',len(changes))
