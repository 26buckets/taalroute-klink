import json,subprocess,datetime,pathlib,time
p=pathlib.Path(__file__).parent;rows=[]
cases=[('api','/api/inzicht/me',[]),('html','/inzicht',[]),('compressed','/inzicht',['--compressed']),('head','/inzicht',['--head']),('rsc','/inzicht',['-H','RSC: 1']),('asset','/klink-wordmark.svg',[])]
for i in range(4):
 hosts=[('workers','https://klink-inzicht-pr8-staging.nico-554.workers.dev'),('custom','https://inzicht-staging.taalroute.nl')]
 if i%2:hosts.reverse()
 for name,base in hosts:
  for kind,path,extra in cases[i:]+cases[:i]:
   h=p/'header-private.txt';started=time.time()*1000
   proc=subprocess.run(['curl','--silent','--show-error','--max-time','20','-H','x-klink-latency: diagnostic-20261104','-D',str(h),'-o','/dev/null','-w','%{json}',*extra,base+path],capture_output=True,text=True)
   finished=time.time()*1000;d=json.loads(proc.stdout) if proc.stdout else {};headers={}
   if h.exists():
    for line in h.read_text().splitlines():
     if ':' in line:
      k,v=line.split(':',1);headers[k.lower()]=v.strip()
   rows.append({'index':len(rows),'repeat':i,'host':name,'kind':kind,'path':path,'startedAtMs':started,'finishedAtMs':finished,'exitCode':proc.returncode,'status':d.get('http_code'),'dnsMs':1000*d.get('time_namelookup',0),'connectMs':1000*d.get('time_connect',0),'tlsMs':1000*d.get('time_appconnect',0),'ttfbMs':1000*d.get('time_starttransfer',0),'totalMs':1000*d.get('time_total',0),'size':d.get('size_download'),'httpVersion':d.get('http_version'),'ray':headers.get('cf-ray'),'contentType':headers.get('content-type'),'encoding':headers.get('content-encoding'),'cacheStatus':headers.get('cf-cache-status'),'serverTiming':headers.get('server-timing')})
   (p/'probe.json').write_text(json.dumps(rows,indent=2)+'\n')
assert len(rows)==48
assert all(r['exitCode']==0 and r['status']=={'api':401,'html':200,'compressed':200,'head':200,'rsc':307,'asset':200}[r['kind']] for r in rows)
print(json.dumps({'requests':len(rows),'errors':sum(r['exitCode']!=0 for r in rows),'maxMs':round(max(r['totalMs'] for r in rows))}))
