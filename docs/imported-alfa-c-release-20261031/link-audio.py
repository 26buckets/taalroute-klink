import json,pathlib,re
D=pathlib.Path('docs/imported-alfa-c-release-20261031')
def load(p):return json.loads(pathlib.Path(p).read_text())
def save(p,d):pathlib.Path(p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
clips=[load(D/(c['id']+'.json'))for c in load(D/'audio-plan.json')['clips']]
f=load('data/klink-alfa-c-functioneel-audio.json');a=load('data/klink-alfa-c-readalong.json')
for c in clips:
 assert c['voiceId']=='h6uBOiAjLKklte8hdYio' if c['role']=='guide' else c['voiceId']=='0qLmDzgqulxcvv0yf3kg'
 if not any(x['text']==c['text'] and x['role']==c['role']for x in f['clips']):f['clips'].append({k:c[k]for k in ['text','role','src','voiceId','sha256','duration']}|{'reused':False})
 if c['role']=='guide' and not any(x['src']==c['src']for x in a['clips']):
  tr=load(D/(c['id']+'-transcription.json'));assert re.sub(r'\W','',tr['text']).lower()==re.sub(r'\W','',c['text']).lower()
  a['clips'].append({'src':c['src'],'text':c['text'],'sha256':c['sha256'],'method':'Speech-to-text word timings; exact normalized transcript checked','words':[{'text':w['text'],'start':w['start'],'end':w['end']}for w in tr['words'] if w['type']=='word']})
save('data/klink-alfa-c-functioneel-audio.json',f);save('data/klink-alfa-c-readalong.json',a);save(D/'audio.json',clips)
